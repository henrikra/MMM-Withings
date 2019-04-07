## Configuration

| Key           | Type   | Required | Notes |
| ------------- | ------ | -------- | ------ |
| clientId   | string | true | Your unique client id from [Withings app dashboard](https://account.withings.com/partner/dashboard_oauth2)
| consumerSecret   | string | true | Your unique secret from [Withings app dashboard](https://account.withings.com/partner/dashboard_oauth2)
| redirectUri   | string | true | Your callback URI from [Withings app dashboard](https://account.withings.com/partner/dashboard_oauth2)
| authorizationCode   | string | true | See guide below to see how to get this

## How to get `authorizationCode`?

You can see the documentation [here](http://developer.withings.com/oauth2/#tag/OAuth-2.0%2Fpaths%2Fhttps%3A~1~1account.withings.com~1oauth2_user~1authorize2%3Fresponse_type%3Dcode%5B...%5D%2Fget)

But easier way to do this is to:
1. Call this URL in a browser `https://account.withings.com/oauth2_user/authorize2?response_type=code&scope=user.metrics&state=123123&client_id=<yourClientId>&redirect_uri=<yourRedirectUri>`
2. Press `Allow this app` when asking for permission
3. Copy paste query param `code` from address bar of the browser. This `code` is your `authorizationCode`

⚠️ Important! `code` in the address bar is valid only for 30 seconds! So paste it quickly to MMM-Withings module's config and start the mirror 