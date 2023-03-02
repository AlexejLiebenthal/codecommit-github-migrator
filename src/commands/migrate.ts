import { Command, Flags, ux } from "@oclif/core";
import { execa, execaCommand, ExecaReturnValue } from "execa";
import { mkdtemp, rm } from "node:fs/promises";
import { chdir, cwd } from "node:process";
import { join } from "node:path";
import inquirer from "inquirer";
import {
  CodeCommitClient,
  GetPullRequestCommand,
  GetPullRequestCommandOutput,
  GetRepositoryCommand,
  ListPullRequestsCommand,
  PullRequest,
  RepositoryMetadata,
} from "@aws-sdk/client-codecommit";

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
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Migrate);
    const { noMirror, bigFileCleanup } = flags;

    ux.styledHeader("CGM");

    const { ghRepo, ccRepo, jiraBase, hasAllTokens } = await promptProps(flags);
    if (!hasAllTokens) ux.exit(1);

    ux.styledHeader("Prepare Migration");
    const workDir = await prepareMigration();

    try {
      ux.styledHeader("Migration");

      if (!noMirror) {
        await mirrorRepo(workDir, ccRepo, ghRepo, bigFileCleanup);
      }

      const formattedPrs = await getCcPrs(ccRepo, jiraBase);

      await createGhPrs(formattedPrs, ghRepo);
    } catch (error: any) {
      ux.log(error);
    } finally {
      await cleanup(workDir);
    }
  }
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
          "Did you set/configured all the necessary tokens for AWS and GitHub?",
        type: "confirm",
        default: false,
      },
      {
        name: "ghRepo",
        message: "GitHub Repo URL",
        default: "https://github.com/ORG/REPO",
        filter: (r) => new URL(r),
        when: ({ hasAllTokens, ghRepo }) => hasAllTokens && !ghRepo,
      },
      {
        name: "ccRepo",
        message: "CodeCommit Repo URL",
        default: "codecommit://REPO",
        filter: (r) => new URL(r),
        when: ({ hasAllTokens, ccRepo }) => hasAllTokens && !ccRepo,
      },
      {
        name: "jiraBase",
        message: "CodeCommit Repo URL",
        default: "https://ACCOUNT.atlassian.net",
        filter: (r) => new URL(r),
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
  await execaCommand(`git clone --bare ${ccRepo} repo-to-migrate`, {
    stdio: "inherit",
  });

  if (bigFileCleanup) {
    ux.log(`BFG big file cleanup`);
    await execaCommand("bfg --strip-blobs-bigger-than 100M repo-to-migrate", {
      stdio: "inherit",
    });
  }

  const repoToMigrateDir = join(workDir, "repo-to-migrate");
  chdir(repoToMigrateDir);
  ux.log(`Changed into cloned repo dir: ${repoToMigrateDir}\n`);

  if (bigFileCleanup) {
    ux.log("git reflog");
    await execaCommand("git reflog expire --expire=now --all", {
      stdio: "inherit",
    });
    ux.log("git gc");
    await execaCommand("git gc --prune=now --aggressive", {
      stdio: "inherit",
    });
  }

  ux.log(`Push all branches and tags to GitHub - ${ghRepo}\n`);
  await execaCommand(`git push --mirror ${ghRepo}`, {
    stdio: "inherit",
  });
}

async function getCcPrs(ccRepo: URL, jiraBase: URL) {
  ux.log("Get all CodeCommit PRs");
  const client = new CodeCommitClient({});
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
  ghRepo: URL
) {
  ux.log(`Create PRs on GitHub`);
  const progress = ux.progress();
  progress.start(formattedPrs.length, 0);

  const errors: { command: string; out: string; status: number }[] = [];

  for (const pr of formattedPrs) {
    // a little time out so we are not hitting the quota limit
    // eslint-disable-next-line no-await-in-loop
    await sleep(5000)
      .then(() =>
        execa(
          "gh",
          [
            "pr",
            "create",
            "--draft",
            "--head",
            pr.head,
            "--base",
            pr.base,
            "--title",
            pr.title,
            "--body",
            pr.body,
            "--repo",
            `${ghRepo}`,
          ],
          { stdio: "inherit", all: true }
        ).catch((error: ExecaReturnValue) => {
          errors.push({
            command: error.command.slice(0, 200),
            out: error.all || "",
            status: error.exitCode,
          });
        })
      )
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
