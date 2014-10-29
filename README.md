## 796.com Client in Meteor

### Installation

Step 1. Download zipped archive from this repository
Step 2. Install [Meteor](https://www.meteor.com): `curl https://install.meteor.com/ | sh`
Step 3. Create a new Meteor application: `meteor create 796`
Step 4. Remove placeholder files and replace them with the ones from the archive
Step 5. Add necessary packages:

```
meteor add mizzao:bootstrap-3
meteor add jparker:crypto-sha1
meteor add jparker:crypto-hmac
meteor add jparker:crypto-base64
meteor add matteodem:server-session
meteor add iron:router
meteor add maazalik:highcharts
```

Step 6. Run the Meteor server: `meteor`
Step 7. Website is accessible at: `http://localhost:3000`

### Screenshots

![screenshot](https://dl.dropboxusercontent.com/u/1127246/796plus-screen-1.png)
![screenshot](https://dl.dropboxusercontent.com/u/1127246/796plus-screen-2.png)

### Other

* Donations BTC: [3JNTo7aAd9pwfciLtPqBtfFmxs3MH5pDci](http://btc.blockr.io/address/info/3JNTo7aAd9pwfciLtPqBtfFmxs3MH5pDci)
* [Create 796 Account](https://796.com/invite/do/134907)
* 796plus utilizes 796.com API to make requests on your accounts behalf. Your API keys are never sent to any location, they are only store in the Meteor application to make API calls.
