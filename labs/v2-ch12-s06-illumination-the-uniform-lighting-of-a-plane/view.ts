"use client";

import { createElement } from "react";
import { LabShell } from "@/features/labs/ui/lab-shell";
import { model } from "./model";

export default function View() {
  return createElement(LabShell, { model });
}
