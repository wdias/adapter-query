import errorHandler from "errorhandler";

import app from "./app";
import { initDatabase } from "./utils";

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

async function init() {
  try {
    console.log('Initializing Adapter-Query ...');
    await initDatabase();
    /**
   * Start Express server.
   */
    const server = app.listen(8080, () => {
      console.log(
        "  App is running at http://localhost:%d in %s mode",
        8080,
        app.get("env")
      );
      console.log("  Press CTRL-C to stop\n");
    });
  } catch (e) {
    console.error(e);
  }
}

init();
