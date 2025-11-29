import { useState, useEffect } from "react";

export const useKeyPress = (
  targetKey: string,
  callback?: () => void,
  options: {
    noEffectWhileInTextInput?: boolean;
  } = {
    noEffectWhileInTextInput: true,
  }
) => {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      const { key } = event;

      if (options.noEffectWhileInTextInput) {
        const activeElement = document.activeElement;

        // Check if the active element is an input or textarea
        if (
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA"
        ) {
          // Do nothing if in a text input
          return;
        }
      }

      if (key === targetKey) {
        setKeyPressed(true);
        if (callback) callback();
        event.preventDefault();
      }
    };

    const upHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [targetKey, callback]);

  return keyPressed;
};
