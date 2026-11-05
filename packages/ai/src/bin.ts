#!/usr/bin/env node
// Original work by the same author.
import { main } from "./cli.js";
import { gateMain } from "./gate.js";

const sinks = {
  out: (line: string) => console.log(line),
  err: (line: string) => console.error(line),
};
const [command, ...rest] = process.argv.slice(2);

// `gate` runs a child process and handles signals, so it is the one async command.
if (command === "gate") process.exitCode = await gateMain(rest, sinks);
else process.exitCode = main(process.argv.slice(2), sinks);
