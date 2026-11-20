"use client";

import dynamic from "next/dynamic";

const Oneko = dynamic(() => import("oneko"), { ssr: false });

// our two cats — a black one and a valentine one, chasing the cursor together
export default function Pets() {
  return (
    <>
      <Oneko skin="black" sleepEnabled pettable scale={0.9} />
      <Oneko skin="valentine" sleepEnabled pettable scale={0.9} />
    </>
  );
}
