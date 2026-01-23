# Commands

Included is a collection of commands that can be helpful in investigating the site

> ![NOTE] There are more examples in `DEPLOYMENT.md`

- **Set required environment variables**
  ```bash
  source_envfile  # custom function from user's shell environment
  ```

- **Connect to EC2 command line**
  ```bash
  ssh "${EC2_USERNAME}@${EC2_HOST}"
  ```

- **Check if EC2 is running**
  ```bash
  aws ec2 describe-instances --instance-ids "${EC2_INSTANCE_ID}" --query 'Reservations[*].Instances[*].State.Nane' --output text

  aws ec2 describe-instance-status --instance-ids "${EC2_INSTANCE_ID}"
  ```

- **Check server code deployment status on EC2**
  ```bash
  ssh "${EC2_USERNAME}@${EC2_HOST}" 'cd personal-site && git status'
  ```

- **Check webserver is running on EC2**
  ```bash
  # make sure webserver is running
  ssh "${EC2_USERNAME}@${EC2_HOST}" 'pm2 list'

  # check server logs
  ssh "${EC2_USERNAME}@${EC2_HOST}" 'tail -n 100 ~/.pm2/pm2.log'
  ```

- **Re-deploy personal site backend**
  ```bash
  ssh "${EC2_USERNAME}@${EC2_HOST}" 'cd personal-site && ./deploy/refresh-server.sh'
  ```

- **Check most recent GitHub Action deployment status**
  ```bash
  # backend status
  gh run list --limit 1 \
    --json 'name,number,attempt,status,conclusion,startedAt,updatedAt,headBranch' \
    --jq '.[0]' \
    --workflow 'Deploy Backend to EC2'

  # frontend status
  gh run list --limit 1 \
    --json 'name,number,attempt,status,conclusion,startedAt,updatedAt,headBranch' \
    --jq '.[0]' \
    --workflow 'Deploy to S3'
  ```
