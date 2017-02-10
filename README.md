# Vote Reminder
A facebook messenger bot that reminds you to vote in Romania, and what happened when people didn't vote.

## Get Started

### Initial Setup
- Install node.
- Install Serverless framework. `npm install -g serverless`

### Clone the repo 
`git clone https://github.com/cristiandan/votereminder.git`

### Configure project
Create a *sensitive.yml* file with the following:
```
pageAcessToken: <PAGE_ACCESS_TOKEN>
verifyToken: <VERIFY_TOKEN> 
```
> The PAGE_ACCESS_TOKEN is the token you get from Facebook when subscribing the app to a page.
> The VERIFY_TOKEN is the token you set to verify that the endpoint works in Facebook app settings.

### Configure serverless
You can find more [here](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

### To deploy
`npm run depoloy`