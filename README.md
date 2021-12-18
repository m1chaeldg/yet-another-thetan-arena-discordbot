# Yet another discord bot for axie infinity

## Usage

Here are some example snippets to help you get started creating a container.

## Requirement

1. Gmail account(main email to aggregate the emails from scholars emails)
2. Enable all your emails to forward the emails that coming from thetan support to the main email. In gmail, you can use filter to forward only the emails comming from thetan arena support email.
3. Google service account. Enable Google or GMAIL API
4. Google AppScript project that will read the gmail and send it to discord webhook url
5. Create one discord text channel for webhook(make this private since all code will send here.). No scholars can view this channel
6. Create one discord text channel for scholars to request for the codes.

### docker-compose (recommended, [click here for more info](https://docs.linuxserver.io/general/docker-compose))

```yaml
---
version: '2.1'
services:
  wireguard:
    image: ghcr.io/m1chaeldg/yet-another-thetan-arena-discordbot:main
    container_name: yaadb
    environment:
      - DISCORD_BOT_TOKEN="discord token"
      - GOOGLE_EMAIL="service account here"
      - GOOGLE_PRIVATE_KEY="foo"
      - ISKO_SPREADSHEET_ID=foo
    restart: always
```

### docker cli ([click here for more info](https://docs.docker.com/engine/reference/commandline/cli/))

```bash
docker run -d \
  --name=yaadb \
  -e DISCORD_BOT_TOKEN="discord token" \
  -e GOOGLE_EMAIL="service account here" \
  -e GOOGLE_PRIVATE_KEY="foo" \
  -e ISKO_SPREADSHEET_ID=foo \
  --restart always \
  ghcr.io/m1chaeldg/yet-another-thetan-arena-discordbot:main
```

## How does it work?

1. Thentan arena will send the code the the respective email.
2. Gas project will check the email every 30 secs, if there are emails it will forward to discord using webhook
3. The thetan arena discord will read the text(from webhook channel) and send it to the proper user who request it.
