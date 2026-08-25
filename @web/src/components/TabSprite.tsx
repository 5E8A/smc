import type { CSSProperties, ReactNode } from "react";

interface TabSpriteProps {
  selected: boolean;
  column: number;
  className?: string;
  style?: CSSProperties;
}

const TAB_DATA: Record<string, ReactNode> = {
  "selected_1": (
    <>
      <rect x="2" y="0" width="21" height="1" fill="#000000" /><rect x="1" y="1" width="1" height="1" fill="#000000" /><rect x="2" y="1" width="21" height="2" fill="#ffffff" /><rect x="23" y="1" width="1" height="1" fill="#000000" /><rect x="0" y="2" width="1" height="30" fill="#000000" /><rect x="1" y="2" width="1" height="30" fill="#ffffff" /><rect x="23" y="2" width="1" height="1" fill="#c6c6c6" /><rect x="24" y="2" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="2" height="1" fill="#ffffff" /><rect x="4" y="3" width="19" height="29" fill="#c6c6c6" /><rect x="23" y="3" width="2" height="27" fill="#555555" /><rect x="25" y="3" width="1" height="26" fill="#000000" /><rect x="2" y="4" width="1" height="28" fill="#ffffff" /><rect x="3" y="4" width="1" height="28" fill="#c6c6c6" /><rect x="25" y="29" width="1" height="2" fill="#ffffff" /><rect x="23" y="30" width="1" height="1" fill="#555555" /><rect x="24" y="30" width="1" height="1" fill="#ffffff" /><rect x="23" y="31" width="3" height="1" fill="#c6c6c6" />
    </>
  ),
  "selected_2": (
    <>
      <rect x="2" y="0" width="21" height="1" fill="#000000" /><rect x="1" y="1" width="1" height="1" fill="#000000" /><rect x="2" y="1" width="21" height="2" fill="#ffffff" /><rect x="23" y="1" width="1" height="1" fill="#000000" /><rect x="0" y="2" width="1" height="27" fill="#000000" /><rect x="1" y="2" width="1" height="29" fill="#ffffff" /><rect x="23" y="2" width="1" height="1" fill="#c6c6c6" /><rect x="24" y="2" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="2" height="1" fill="#ffffff" /><rect x="4" y="3" width="19" height="29" fill="#c6c6c6" /><rect x="23" y="3" width="2" height="27" fill="#555555" /><rect x="25" y="3" width="1" height="26" fill="#000000" /><rect x="2" y="4" width="1" height="27" fill="#ffffff" /><rect x="3" y="4" width="1" height="28" fill="#c6c6c6" /><rect x="0" y="29" width="1" height="2" fill="#ffffff" /><rect x="25" y="29" width="1" height="2" fill="#ffffff" /><rect x="23" y="30" width="1" height="1" fill="#555555" /><rect x="24" y="30" width="1" height="1" fill="#ffffff" /><rect x="0" y="31" width="3" height="1" fill="#c6c6c6" /><rect x="23" y="31" width="3" height="1" fill="#c6c6c6" />
    </>
  ),
  "selected_3": (
    <>
      <rect x="2" y="0" width="21" height="1" fill="#000000" /><rect x="1" y="1" width="1" height="1" fill="#000000" /><rect x="2" y="1" width="21" height="2" fill="#ffffff" /><rect x="23" y="1" width="1" height="1" fill="#000000" /><rect x="0" y="2" width="1" height="27" fill="#000000" /><rect x="1" y="2" width="1" height="29" fill="#ffffff" /><rect x="23" y="2" width="1" height="1" fill="#c6c6c6" /><rect x="24" y="2" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="2" height="1" fill="#ffffff" /><rect x="4" y="3" width="19" height="29" fill="#c6c6c6" /><rect x="23" y="3" width="2" height="27" fill="#555555" /><rect x="25" y="3" width="1" height="26" fill="#000000" /><rect x="2" y="4" width="1" height="27" fill="#ffffff" /><rect x="3" y="4" width="1" height="28" fill="#c6c6c6" /><rect x="0" y="29" width="1" height="2" fill="#ffffff" /><rect x="25" y="29" width="1" height="2" fill="#ffffff" /><rect x="23" y="30" width="1" height="1" fill="#555555" /><rect x="24" y="30" width="1" height="1" fill="#ffffff" /><rect x="0" y="31" width="3" height="1" fill="#c6c6c6" /><rect x="23" y="31" width="3" height="1" fill="#c6c6c6" />
    </>
  ),
  "selected_4": (
    <>
      <rect x="2" y="0" width="21" height="1" fill="#000000" /><rect x="1" y="1" width="1" height="1" fill="#000000" /><rect x="2" y="1" width="21" height="2" fill="#ffffff" /><rect x="23" y="1" width="1" height="1" fill="#000000" /><rect x="0" y="2" width="1" height="27" fill="#000000" /><rect x="1" y="2" width="1" height="29" fill="#ffffff" /><rect x="23" y="2" width="1" height="1" fill="#c6c6c6" /><rect x="24" y="2" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="2" height="1" fill="#ffffff" /><rect x="4" y="3" width="19" height="29" fill="#c6c6c6" /><rect x="23" y="3" width="2" height="27" fill="#555555" /><rect x="25" y="3" width="1" height="26" fill="#000000" /><rect x="2" y="4" width="1" height="27" fill="#ffffff" /><rect x="3" y="4" width="1" height="28" fill="#c6c6c6" /><rect x="0" y="29" width="1" height="2" fill="#ffffff" /><rect x="25" y="29" width="1" height="2" fill="#ffffff" /><rect x="23" y="30" width="1" height="1" fill="#555555" /><rect x="24" y="30" width="1" height="1" fill="#ffffff" /><rect x="0" y="31" width="3" height="1" fill="#c6c6c6" /><rect x="23" y="31" width="3" height="1" fill="#c6c6c6" />
    </>
  ),
  "unselected_1": (
    <>
      <rect x="2" y="2" width="21" height="1" fill="#000000" /><rect x="1" y="3" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="21" height="2" fill="#ffffff" /><rect x="23" y="3" width="1" height="1" fill="#000000" /><rect x="0" y="4" width="1" height="28" fill="#000000" /><rect x="1" y="4" width="1" height="28" fill="#ffffff" /><rect x="23" y="4" width="1" height="1" fill="#8b8b8b" /><rect x="24" y="4" width="1" height="1" fill="#000000" /><rect x="2" y="5" width="2" height="1" fill="#ffffff" /><rect x="4" y="5" width="19" height="27" fill="#8b8b8b" /><rect x="23" y="5" width="2" height="27" fill="#555555" /><rect x="25" y="5" width="1" height="27" fill="#000000" /><rect x="2" y="6" width="1" height="26" fill="#ffffff" /><rect x="3" y="6" width="1" height="26" fill="#8b8b8b" />
    </>
  ),
  "unselected_2": (
    <>
      <rect x="2" y="2" width="21" height="1" fill="#000000" /><rect x="1" y="3" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="21" height="2" fill="#ffffff" /><rect x="23" y="3" width="1" height="1" fill="#000000" /><rect x="0" y="4" width="1" height="28" fill="#000000" /><rect x="1" y="4" width="1" height="28" fill="#ffffff" /><rect x="23" y="4" width="1" height="1" fill="#8b8b8b" /><rect x="24" y="4" width="1" height="1" fill="#000000" /><rect x="2" y="5" width="2" height="1" fill="#ffffff" /><rect x="4" y="5" width="19" height="27" fill="#8b8b8b" /><rect x="23" y="5" width="2" height="27" fill="#555555" /><rect x="25" y="5" width="1" height="27" fill="#000000" /><rect x="2" y="6" width="1" height="26" fill="#ffffff" /><rect x="3" y="6" width="1" height="26" fill="#8b8b8b" />
    </>
  ),
  "unselected_3": (
    <>
      <rect x="2" y="2" width="21" height="1" fill="#000000" /><rect x="1" y="3" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="21" height="2" fill="#ffffff" /><rect x="23" y="3" width="1" height="1" fill="#000000" /><rect x="0" y="4" width="1" height="28" fill="#000000" /><rect x="1" y="4" width="1" height="28" fill="#ffffff" /><rect x="23" y="4" width="1" height="1" fill="#8b8b8b" /><rect x="24" y="4" width="1" height="1" fill="#000000" /><rect x="2" y="5" width="2" height="1" fill="#ffffff" /><rect x="4" y="5" width="19" height="27" fill="#8b8b8b" /><rect x="23" y="5" width="2" height="27" fill="#555555" /><rect x="25" y="5" width="1" height="27" fill="#000000" /><rect x="2" y="6" width="1" height="26" fill="#ffffff" /><rect x="3" y="6" width="1" height="26" fill="#8b8b8b" />
    </>
  ),
  "unselected_4": (
    <>
      <rect x="2" y="2" width="21" height="1" fill="#000000" /><rect x="1" y="3" width="1" height="1" fill="#000000" /><rect x="2" y="3" width="21" height="2" fill="#ffffff" /><rect x="23" y="3" width="1" height="1" fill="#000000" /><rect x="0" y="4" width="1" height="28" fill="#000000" /><rect x="1" y="4" width="1" height="28" fill="#ffffff" /><rect x="23" y="4" width="1" height="1" fill="#8b8b8b" /><rect x="24" y="4" width="1" height="1" fill="#000000" /><rect x="2" y="5" width="2" height="1" fill="#ffffff" /><rect x="4" y="5" width="19" height="27" fill="#8b8b8b" /><rect x="23" y="5" width="2" height="27" fill="#555555" /><rect x="25" y="5" width="1" height="27" fill="#000000" /><rect x="2" y="6" width="1" height="26" fill="#ffffff" /><rect x="3" y="6" width="1" height="26" fill="#8b8b8b" />
    </>
  ),
};

const TabSprite = ({ selected, column, className = "", style }: TabSpriteProps) => (
  <svg viewBox="0 0 26 32" className={className} style={style} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
    {TAB_DATA[`${selected ? "selected" : "unselected"}_${column + 1}`]}
  </svg>
);

export default TabSprite;
