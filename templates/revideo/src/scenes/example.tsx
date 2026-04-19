import { makeScene2D, Txt } from "@revideo/2d";
import { createRef, waitFor } from "@revideo/core";

export default makeScene2D(function* (view) {
  const title = createRef<Txt>();
  const subtitle = createRef<Txt>();

  view.add(
    <>
      <Txt
        ref={title}
        text="Your title here"
        fontSize={120}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#0f172a"
        y={-60}
        opacity={0}
      />
      <Txt
        ref={subtitle}
        text="Describe your change to Claude Code"
        fontSize={40}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#475569"
        y={60}
        opacity={0}
      />
    </>,
  );

  yield* title().opacity(1, 0.6);
  yield* subtitle().opacity(1, 0.6);
  yield* waitFor(2);
});
