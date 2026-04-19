import { Composition } from "remotion";
import { MainComposition, mainSchema } from "./Composition";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={MainComposition}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      schema={mainSchema}
      defaultProps={{
        title: "Your title here",
        subtitle: "Describe your change to Claude Code",
      }}
    />
  );
};
