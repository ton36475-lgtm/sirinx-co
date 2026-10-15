import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { AnimatePresence as FramerAnimatePresence, motion as framerMotion } from "framer-motion";
import { MOTION_HOME_ENABLED } from "@shared/motionFlags";

type StaticMotionProps = {
  animate?: unknown;
  custom?: unknown;
  exit?: unknown;
  initial?: unknown;
  layout?: unknown;
  transition?: unknown;
  variants?: unknown;
  viewport?: unknown;
  whileHover?: unknown;
  whileInView?: unknown;
  whileTap?: unknown;
};

type PresenceProps = {
  children: ReactNode;
  initial?: boolean;
  mode?: string;
};

const stripMotionProps = <T extends StaticMotionProps>(props: T) => {
  const {
    animate,
    custom,
    exit,
    initial,
    layout,
    transition,
    variants,
    viewport,
    whileHover,
    whileInView,
    whileTap,
    ...domProps
  } = props;

  return domProps;
};

function StaticAnimatePresence({ children }: PresenceProps) {
  return <>{children}</>;
}

const staticMotion = {
  div: (props: HTMLAttributes<HTMLDivElement> & StaticMotionProps) => (
    <div {...stripMotionProps(props)} />
  ),
  img: (props: ImgHTMLAttributes<HTMLImageElement> & StaticMotionProps) => (
    <img {...stripMotionProps(props)} />
  ),
  button: (props: ButtonHTMLAttributes<HTMLButtonElement> & StaticMotionProps) => (
    <button {...stripMotionProps(props)} />
  ),
};

export const AnimatePresence = MOTION_HOME_ENABLED
  ? FramerAnimatePresence
  : StaticAnimatePresence;
export const motion = MOTION_HOME_ENABLED ? framerMotion : staticMotion;
