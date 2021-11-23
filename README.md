# Flecs Explorer
Web-based UI for monitoring Flecs applications, trying out queries &amp; learning ECS

<img width="995" alt="Screen Shot 2021-11-07 at 10 20 51 PM" src="https://user-images.githubusercontent.com/9919222/140693729-12b9c7bb-3147-4040-9c15-d830e9bc1080.png">

A live version of the explorer is running @ https://flecs.dev/explorer

## Usage
The flecs explorer can be used in standalone mode (default) or remote mode. In standalone mode, the application runs 100% in the browser with a webasm build of Flecs. In remote mode, the explorer connects to a runningn flecs application.

The easiest way to get started with the flecs explorer is to use the hosted application at https://flecs.dev/explorer. If the explorer finds a Flecs application running on http://localhost:27750, it will connect to it automatically. The server is only used to retrieve the resources to run the explorer, and no data is exchanged from the explorer or your application to a remote machine.

The following browsers have known policies that prevent connecting to a port on local host:
 - Safari
 - Brave (can be overridden by configuring "Shield" to be down)
 
If a browser doesn't suppport connecting to localhost from a remote address, you can self-host the explorer with the following commands:

### URL options
The following options can be added to the URL:

**Always connect to remote app (will keep trying to connect to localhost:27750)**
```
?remote=true
```

**Never connect to remote app (will always use the webasm version of flecs that runs in the browser)**
```
?local=true
```

**Specify a custom host to connect to (sets remote to true)**
```
?host=10.20.30.40:1234
```

```c
git clone https://github.com/flecs-hub/explorer
cd explorer/etc
python3 -m http.server
```
