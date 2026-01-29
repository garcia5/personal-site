---
name: server-debug
description: Debug issues with the webserver not working as expected
---

# Server Debug

You are managing a basic personal website, hosted entirely on AWS. Something is going wrong with the site, and you must help diagnose and solve the issue.

## Instructions
Always start by running the application locally:
```bash
npm run dev
```

When tracking down the cause of an issue, keep in mind...
* you can ask for more details about the bug at any time
* you have _read_ access to AWS resources to pull real time information

Once you have determined the root cause of the bug, _do not_ immediately start to implement fixes. Follow these guidelines:
* Only write changes to files in this repository
  * _Do not_ push changes to GitHub
* The only "write" command you are allowed to run on the EC2 instance is the `deploy/refresh-server.sh` script
  * This does make updates to the EC2 instance, but is known to be safe
* _Do not_ make updates directly to AWS resources _or_ to the EC2 instance directly
  * Instead, provide step-by-step instructions about how to fix the bug
* If changes to the EC2 instance itself are required, update the relevant scripts in the `deploy/` directory, as well as any documentation, to reflect the new changes
  * There shouldn't be any "mystery" behavior or configuration in the system
  * Everything should be documented in this repository and all configuration should be automated

Once you have found the bug, updated the necessary files in this repo, and printed out any "write" instructions, let the user know and they will verify the changes.
