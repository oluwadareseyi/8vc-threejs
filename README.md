# 8vc-threejs

To run it locally in Webflow, run `yarn dev`, add this script to the custom code section of Webflow, and redeploy the page:

```
<script type="module" src="http://localhost:3000/@vite/client"></script>
<script type="module" src="http://localhost:3000/src/main.js"></script>
```

When you're done, build the project using `yarn build`, add a txt extension to the js generated, upload it to webflow and add a new script to the custom code section like so:

```
<script
  type="text/javascript"
  src="https://uploads-ssl.webflow.com/649c36de625a16ebb7e23a94/651f0ec3197d02cd09ea4301_main.js.txt"
></script>

```
