#!/usr/bin/env node
import { runMain } from "citty";

import { main } from "./commands/main";

await runMain(main);
