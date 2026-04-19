import path from "node:path";
import { FFCreator, FFScene, FFText } from "ffcreator";

const outputPath = process.env.AVR_OUTPUT_PATH ?? path.resolve("out/video.mp4");

const creator = new FFCreator({
  width: 1920,
  height: 1080,
  fps: 30,
  output: outputPath,
  log: true,
});

const scene = new FFScene();
scene.setBgColor("#ffffff");
scene.setDuration(3);

const title = new FFText({
  text: "Your title here",
  x: 960,
  y: 500,
  fontSize: 120,
  color: "#0f172a",
});
title.alignCenter();
scene.addChild(title);

const subtitle = new FFText({
  text: "Describe your change to Claude Code",
  x: 960,
  y: 640,
  fontSize: 40,
  color: "#475569",
});
subtitle.alignCenter();
scene.addChild(subtitle);

creator.addChild(scene);
creator.start();

creator.on("progress", (e) => {
  process.stdout.write(`progress ${Math.round(e.percent * 100)}%\n`);
});
creator.on("complete", (e) => {
  process.stdout.write(`done ${e.output}\n`);
});
creator.on("error", (e) => {
  process.stderr.write(`error ${e.error}\n`);
  process.exit(1);
});
