import fs from "fs-extra";
import path from "path";
import spawn from "cross-spawn";
import simplegit from "simple-git/promise";

import { green, yellow, red } from "./write-help";

function isInGitRepo(path: string): boolean {
  const gitRevParse = spawn.sync(
    "git",
    ["rev-parse", "--is-inside-work-tree"],
    {
      cwd: path,
      stdio: "ignore",
    }
  );

  if (gitRevParse.status === 0) {
    console.log("Found already initialized Git repository");
    return true;
  }
  return false;
}

function isGitInstalled(): boolean {
  const command = spawn.sync("git", ["--version"], {
    stdio: "ignore",
  });

  if (command.error) {
    console.log("`git` binary not found");
    return false;
  }
  return true;
}

/**
 * Initialize a Git repository in target destination folder
 *
 * @param {String} destination the destination folder path
 */
export async function initGit(destination: string): Promise<void> {
  let initializedGit = false;

  console.log(`\nInitializing Git repository in folder '${destination}'`);

  if (!isGitInstalled() || isInGitRepo(destination)) {
    console.log(yellow("Skipping Git initialization"));
    return;
  }

  const git = simplegit(destination);

  await git
    .init()
    .then(() => (initializedGit = true))
    .then(() => git.add("./*"))
    .then(() => git.commit("Initial commit from Create Probot App"))
    .catch((error) => {
      if (initializedGit) {
        try {
          const gitFolder = path.join(destination, ".git");
          console.log(red(`Cleaning up ${gitFolder} folder`));
          fs.removeSync(gitFolder);
        } catch (err) {} // ignore
      }
      throw error;
    })
    .then(() => console.log(green("Initialized a Git repository")));
}
