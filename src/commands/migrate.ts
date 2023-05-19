import { Command, Flags, ux } from "@oclif/core";
import { $ } from "execa";
import { mkdtemp, rm } from "node:fs/promises";
import { chdir, cwd } from "node:process";
import { join } from "node:path";
import inquirer from "inquirer";
import {
  CodeCommitClient,
  CodeCommitClientConfig,
  GetPullRequestCommand,
  GetPullRequestCommandOutput,
  GetRepositoryCommand,
  ListPullRequestsCommand,
  PullRequest,
  RepositoryMetadata,
} from "@aws-sdk/client-codecommit";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { fromIni } from "@aws-sdk/credential-providers";
import { Octokit } from "@octokit/rest";
import { boolean } from "@oclif/core/lib/flags";

const $$ = $({ stdio: "inherit" });
export default class Migrate extends Command {
  static override description = "Migrates a CodeCommit Repo to GitHub";

  static override examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> -M",
    "<%= config.bin %> <%= command.id %> -b",
    "<%= config.bin %> <%= command.id %> -c codecommit://REPO -g https://github.com/ORG/REPO -j https://ACCOUNT.atlassian.net",
    "<%= config.bin %> <%= command.id %> -h",
  ];

  static override flags = {
    ccRepo: Flags.url({
      char: "c",
      description: "url of the migration source CodeCommit repo",
      helpValue: "codecommit://REPO",
    }),
    ghRepo: Flags.url({
      char: "g",
      description: "url of the migration target GitHub repo",
      parse: async (input) => validateGhRepoUrl(input),
      helpValue: "https://github.com/ORG/REPO",
    }),
    jiraBase: Flags.url({
      char: "j",
      description: "baseurl of jira",
      helpValue: "https://ACCOUNT.atlassian.net",
    }),
    noMirror: Flags.boolean({
      char: "M",
      description:
        "set if you do not like to mirror the codecommit repo automatically",
      helpGroup: "git",
    }),
    bigFileCleanup: Flags.boolean({
      char: "b",
      description:
        "set if you like/need a `bfg` cleanup of big files over 100MB.\n" +
        "Can not used together with `--noMirror, -M` flag",
      exclusive: ["noMirror"],
      helpGroup: "git",
    }),
    help: Flags.help({ char: "h", helpGroup: "help" }),
    awsRegion: Flags.string({
      env: "AWS_REGION",
      description: "AWS Region can also be set through AWS_REGION env",
      default: "eu-central-1",
      helpGroup: "AWS",
    }),
    awsAccessKeyId: Flags.string({
      env: "AWS_ACCESS_KEY_ID",
      description:
        "AWS Access Key Id can also be set through AWS_ACCESS_KEY_ID env",
      helpGroup: "AWS",
      dependsOn: ["awsSecretAccessKey"],
    }),
    awsSecretAccessKey: Flags.string({
      env: "AWS_SECRET_ACCESS_KEY",
      description:
        "AWS Secret Access Key can also be set through AWS_SECRET_ACCESS_KEY env",
      helpGroup: "AWS",
      dependsOn: ["awsAccessKeyId"],
    }),
    awsSessionToken: Flags.string({
      env: "AWS_SESSION_TOKEN",
      description:
        "AWS Session Token can also be set through AWS_SESSION_TOKEN env",
      helpGroup: "AWS",
      dependsOn: ["awsAccessKeyId", "awsSecretAccessKey"],
    }),
    awsProfile: Flags.string({
      env: "AWS_PROFILE",
      description:
        "AWS Profile to use for credentials can also be set through AWS_PROFILE env\n" +
        "If awsProfile flag is provided, the profile will be used instead of `awsAccessKeyId` and `awsSecretAccessKey`",
      helpGroup: "AWS",
    }),
    ghToken: Flags.string({
      env: "GITHUB_TOKEN",
      description: "GitHub Token can also be set through GITHUB_TOKEN env",
      helpGroup: "GitHub",
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Migrate);
    const { noMirror, bigFileCleanup } = flags;

    ux.styledHeader("CGM");

    const codeCommitConfig = await getCodeCommitConfig(flags);
    const ghToken = await getGithubToken(flags);

    const { ghRepo, ccRepo, jiraBase, hasAllTokens } = await promptProps(flags);
    if (!hasAllTokens) ux.exit(1);

    const ownerRepo = await checkIfGhRepoExists(ghRepo, ghToken);

    ux.styledHeader("Prepare Migration");
    const workDir = await prepareMigration();

    try {
      ux.styledHeader("Migration");

      if (!noMirror) {
        await mirrorRepo(workDir, ccRepo, ghRepo, bigFileCleanup);
      }

      const formattedPrs = await getCcPrs(ccRepo, jiraBase, codeCommitConfig);

      await createGhPrs(formattedPrs, ownerRepo, ghToken);
    } catch (error: any) {
      ux.log(error);
    } finally {
      await cleanup(workDir);
    }
  }
}

async function getCodeCommitConfig({
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
  awsSessionToken,
  awsProfile,
}: {
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsProfile?: string;
}): Promise<CodeCommitClientConfig> {
  ux.log("validate aws config\n");
  const credentials = awsProfile
    ? fromIni({
        profile: awsProfile,
        mfaCodeProvider: () =>
          inquirer
            .prompt({
              type: "input",
              name: "otp",
              message: "AWS OTP?",
            })
            .then((answer) => answer.otp),
      })
    : awsAccessKeyId && awsSecretAccessKey
    ? {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        sessionToken: awsSessionToken,
      }
    : undefined;

  const config = {
    region: awsRegion,
    credentials,
  };

  const client = new STSClient(config);
  try {
    // Send dummy request, to check if the credentials are valid
    ux.styledJSON({
      awsArn: (await client.send(new GetCallerIdentityCommand({}))).Arn,
    });
    ux.log();
  } catch (error: any) {
    ux.log("Provided AWS Credentials are invalid");
    ux.error(error);
  } finally {
    client.destroy();
  }

  return config;
}

async function getGithubToken({ ghToken }: { ghToken?: string }) {
  ux.log("validate github token\n");

  let token = "";
  try {
    token = ghToken ? ghToken : (await $$`gh auth token`).stdout;
    ux.styledJSON(
      await new Octokit({
        auth: token,
      }).rest.users
        .getAuthenticated()
        .then((user) => ({ githubLogin: user.data.login }))
    );
    ux.log();
  } catch (error: any) {
    ux.log("Couldn't get a GitHub Token");
    ux.error(error);
  }

  return token;
}

async function promptProps(flags: {
  ghRepo?: URL;
  ccRepo?: URL;
  jiraBase?: URL;
  noMirror: boolean;
}) {
  return inquirer.prompt<{
    hasAllTokens: boolean;
    ccRepo: URL;
    ghRepo: URL;
    jiraBase: URL;
  }>(
    [
      {
        name: "hasAllTokens",
        message:
          "You need to have all tokens for AWS CodeCommit and GitHub configured beforehand!\n" +
          "Are you sure you set/configured all the necessary tokens for AWS and GitHub correctly?",
        type: "confirm",
        default: false,
      },
      {
        name: "ghRepo",
        message: "GitHub Repo URL",
        default: "https://github.com/ORG/REPO",
        filter: (url) => validateGhRepoUrl(url),
        when: ({ hasAllTokens, ghRepo }) => hasAllTokens && !ghRepo,
      },
      {
        name: "ccRepo",
        message: "CodeCommit Repo URL",
        default: "codecommit://REPO",
        filter: (url) => new URL(url),
        when: ({ hasAllTokens, ccRepo }) => hasAllTokens && !ccRepo,
      },
      {
        name: "jiraBase",
        message: "CodeCommit Repo URL",
        default: "https://ACCOUNT.atlassian.net",
        filter: (url) => new URL(url),
        when: ({ hasAllTokens, jiraBase }) => hasAllTokens && !jiraBase,
      },
    ],
    {
      ghRepo: flags.ghRepo,
      ccRepo: flags.ccRepo,
      jiraBase: flags.jiraBase,
    }
  );
}

const ghRegex =
  /^(?:https?:\/\/github\.com\/|git@github\.com:)?([\w-]+)\/([\w-]+)(?:\.git)?$/;

function validateGhRepoUrl(url: string): URL {
  if (!ghRegex.test(url))
    throw new Error(
      `Invalid URL "${url}". Please provide the URL in this format: https://github.com/ORG/REPO`
    );
  return new URL(url);
}

async function prepareMigration() {
  ux.log("Create work dir...");
  const workDir = await mkdtemp(join(cwd(), "cgm-"));
  ux.log(`workdir created: ${workDir}\n`);

  chdir(workDir);
  ux.log("Changed into workdir\n");
  return workDir;
}

async function mirrorRepo(
  workDir: string,
  ccRepo: URL,
  ghRepo: URL,
  bigFileCleanup?: boolean
) {
  ux.log(`Clone CodeCommit Repo - ${ccRepo}:`);
  await $$`git clone --bare ${ccRepo.toString()} repo-to-migrate`;

  if (bigFileCleanup) {
    ux.log(`BFG big file cleanup`);
    await $$`bfg --strip-blobs-bigger-than 100M repo-to-migrate`;
  }

  const repoToMigrateDir = join(workDir, "repo-to-migrate");
  chdir(repoToMigrateDir);
  ux.log(`Changed into cloned repo dir: ${repoToMigrateDir}\n`);

  if (bigFileCleanup) {
    ux.log("git reflog");
    await $$`git reflog expire --expire=now --all`;

    ux.log("git gc");
    await $$`git gc --prune=now --aggressive`;
  }

  await ux.anykey(
    `Press any key when you are ready (e.g. after disconnecting VPN) to push repo to: ${ghRepo}`
  );

  ux.log(`Push all branches and tags to GitHub - ${ghRepo}\n`);
  await $$`git push --mirror ${ghRepo.toString()}`;
}

async function getCcPrs(
  ccRepo: URL,
  jiraBase: URL,
  codeCommitConfig: CodeCommitClientConfig
) {
  ux.log("Get all CodeCommit PRs");
  const client = new CodeCommitClient(codeCommitConfig);
  const listPrs = new ListPullRequestsCommand({
    repositoryName: ccRepo.host,
    pullRequestStatus: "open",
  });
  const listPrsResult = await client.send(listPrs).catch((error) => {
    throw new Error(error);
  });

  const getRepo = new GetRepositoryCommand({ repositoryName: ccRepo.host });
  const ccRepoMetadata = (await client.send(getRepo)).repositoryMetadata;

  const prIds = listPrsResult.pullRequestIds ?? [];
  const ccPrs: GetPullRequestCommandOutput[] = [];

  const progress = ux.progress();
  progress.start(prIds.length, 0);
  for (const prId of prIds) {
    const getPrRequest = client.send(
      new GetPullRequestCommand({ pullRequestId: prId })
    );

    // eslint-disable-next-line no-await-in-loop
    ccPrs.push(await getPrRequest);
    progress.increment();
  }

  client.destroy();
  progress.stop();

  const formattedPrs = ccPrs.map(({ pullRequest }) => {
    return {
      title: pullRequest?.title || "",
      body: createBody(pullRequest, ccRepoMetadata, jiraBase),
      base: pullRequest?.pullRequestTargets?.[0]?.destinationReference || "",
      head: pullRequest?.pullRequestTargets?.[0]?.sourceReference || "",
    };
  });
  return formattedPrs;
}

function createBody(
  pullRequest?: PullRequest,
  repoMetadata?: RepositoryMetadata,
  jiraBase?: URL
) {
  if (!pullRequest || !repoMetadata || !jiraBase) return "";

  const rawData = JSON.stringify(pullRequest, null, 2);

  const region = repoMetadata.Arn?.split(":")[3];
  const repo = repoMetadata.repositoryName;
  const prId = pullRequest.pullRequestId;
  const ccUrl = `https://${region}.console.aws.amazon.com/codesuite/codecommit/repositories/${repo}/pull-requests/${prId}`;

  const issueKeyRegExp = /^([A-Z]+-\d+)/;
  const match = pullRequest.title?.match(issueKeyRegExp);
  const jiraTicket = match?.[1];
  const jiraUrl = `${jiraBase}browse/${jiraTicket}`;

  const author = pullRequest?.authorArn?.split("/")[2]
    ? pullRequest?.authorArn?.split("/")[2]
    : pullRequest?.authorArn?.split(":")[5];

  const created = pullRequest.creationDate?.toLocaleString("en-de", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  const updated = pullRequest.lastActivityDate?.toLocaleString("en-de", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  return (
    (pullRequest.description || "") +
    "\n---\n" +
    `- 🏚️ [Original CodeCommit-PR ${prId}](${ccUrl})\n` +
    `  - 📧 Author: \`${author}\`\n` +
    `  - 🚀 Created: ${created}\n` +
    `  - 📝 Updated: ${updated}\n` +
    `- 🎟️ [Ticket: ${jiraTicket}](${jiraUrl})\n` +
    "\n<details><summary>Raw AWS Pull Request Object</summary>\n\n```json\n" +
    rawData +
    "\n```\n\n</details>"
  );
}

async function createGhPrs(
  formattedPrs: { title: string; body: string; base: string; head: string }[],
  { owner, repo }: { owner: string; repo: string },
  ghToken: string
) {
  ux.log(`Create PRs on GitHub`);
  const progress = ux.progress();
  progress.start(formattedPrs.length, 0);

  const errors: {
    params: (typeof formattedPrs)[number] & { repo: string };
    errorMessage: string;
  }[] = [];

  const octokit = new Octokit({ auth: ghToken });
  for (const pr of formattedPrs) {
    // a little time out so we are not hitting the quota limit
    // eslint-disable-next-line no-await-in-loop
    await sleep(5000)
      .then(() =>
        octokit.pulls.create({
          draft: true,
          head: pr.head,
          base: pr.base,
          title: pr.title,
          body: pr.body,
          owner: owner,
          repo: repo,
        })
      )
      .catch((error: Error) => {
        errors.push({
          params: {
            ...pr,
            body: pr.body.slice(0, 200),
            repo: `${owner}/${repo}`,
          },
          errorMessage: error.message,
        });
      })
      .finally(() => {
        progress.increment();
      });
  }

  progress.stop();

  if (errors.length > 0) ux.styledJSON({ errors });
}

async function sleep(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

async function cleanup(workDir: string) {
  ux.styledHeader("cleanup");
  ux.log(`remove workdir: ${workDir}\n`);
  await rm(workDir, { recursive: true });
}

async function checkIfGhRepoExists(ghRepo: URL, ghToken: string) {
  ux.log(`Checking if ${ghRepo} exists`);
  const octokit = new Octokit({ auth: ghToken });
  const { owner, repo } = parseOwnerAndRepoFromURL(ghRepo);

  try {
    await octokit.repos.get({ owner, repo });
    ux.log(`Found repo "${owner}/${repo}"`);
  } catch (error: any) {
    ux.log(`Couldn't access repo "${owner}/${repo}"`);
    ux.error(error);
  }

  return { owner, repo };
}

function parseOwnerAndRepoFromURL(ghRepo: URL) {
  const match = `${ghRepo}`.match(ghRegex);
  if (!match) {
    ux.error(`"${ghRepo}" does not match a GitHub Repo URL`);
  }

  return {
    owner: match![1] as string,
    repo: match![2] as string,
  };
}
