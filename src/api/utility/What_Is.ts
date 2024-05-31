// What is typescript?
/*
what_is_response
==================
{
what: “object”,  // What
[“property”, “property”, ...]  // Is
}
*/
// What is Express?
import { Request } from "express";

class WhatIs {
  what: string;
  is: any;

  constructor(what: string, is: any) {
    this.what = what;
    this.is = is;
  }
}

function what_is(what: string, is: any) {
  return new WhatIs(what, is);
}

function wis_array(req: Request) {
  return Array.isArray(req.body["is"]) ? req.body["is"] : [];
}

function wis_string(req: Request) {
  return typeof req.body["is"] === "string" ? req.body["is"] : "";
}

function wis_obj(req: Request) {
  return typeof req.body["is"] === "object" ? req.body["is"] : null;
}

export { what_is, wis_array, wis_string, wis_obj };
