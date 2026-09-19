import { createRixRepl } from "../src/repl-runtime.js";
import { testPortableBundleHost } from "../../rix/tests/helpers/portable-bundle-host.js";
testPortableBundleHost("RiX Web", options => createRixRepl({ ...options, autoLoadPlugins: false }));
