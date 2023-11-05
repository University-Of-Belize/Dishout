import { Request, Response } from "express";
import Categories from "../../../database/models/Categories";
import Orders from "../../../database/models/Orders";
import Products from "../../../database/models/Products";
import Promos from "../../../database/models/Promos";
import Reviews from "../../../database/models/Reviews";
import Users from "../../../database/models/Users";
import MiniSearch from "minisearch";
import { LogInfo } from "../../../util/Logger";
import { get_authorization_user } from "../../utility/Authentication";
import { iwe_strings } from "../../strings";
import settings from "../../../config/settings.json";

async function global_lookup(
  req: Request,
  res: Response,
  engine: MiniSearch<any>,
) {
  let shouldDisplay = false;
  // Quietly check for staff access
  let user = await get_authorization_user(req);
  if (!user) {
    shouldDisplay = false; // @ts-ignore
    user = { staff: false };
  }

  // Get query parameters from the URL
  const { filter, q } = req.query;
  // Perform a search
  const results = engine.search(q as string, {
    filter: (result) => {
      shouldDisplay =
        result.match[(q as string).toLowerCase()]?.includes(
          (filter as string).toLowerCase(),
        ) ||
        Object.keys(result.match).some((element) =>
          (q as string).split(iwe_strings.Search.UTOKENIZE).includes(element),
        );
      //   console.log(user?.staff, shouldDisplay, result); // Debug ONLY
      if (
        // @ts-ignore
        !user?.staff &&
        settings.search["excluded-terms"].includes(filter as string)
      ) {
        // Your code here
        shouldDisplay = false;
      }
      console.log(shouldDisplay);
      return shouldDisplay;
    },
  });

  // Send the results
  res.json(results);
}

async function initialize_engine() {
  // Get all objects from the database
  const allCategories = await Categories.find();
  const allOrders = await Orders.find().populate(["order_from", "override_by"]);
  const allProducts = await Products.find().populate(["category", "reviews"]);
  const allPromos = await Promos.find().populate("created_by");
  const allReviews = await Reviews.find().populate(["reviewer", "product"]);
  const allUsers = await Users.find();

  // Create a new MiniSearch instance
  const miniSearch = new MiniSearch({
    fields: settings.search["searchable-filters"], // fields to index for full-text search
    storeFields: settings.search["visible-fields"], // fields to return with search results
    searchOptions: { prefix: true, fuzzy: 0.2 },
    extractField: (document, fieldName) => {
      // If field name is 'pubYear', extract just the year from 'pubDate'
      if (fieldName === "reviews") {
        return document["reviews"];
      }
      if (fieldName === "order_from") {
        return document["order_from"];
      }
      if (fieldName === "override_by") {
        return document["override_by"];
      }
      if (fieldName === "category") {
        return document["category"];
      }
      if (fieldName === "created_by") {
        return document["created_by"];
      }
      if (fieldName === "reviewer") {
        return document["reviewer"];
      }
      if (fieldName === "product") {
        return document["product"];
      }

      return document[fieldName];
    },
  });

  // Index the database
  LogInfo("Indexing database...");

  // Add all objects to MiniSearch
  miniSearch.addAll([
    ...allCategories,
    ...allOrders,
    ...allProducts,
    ...allPromos,
    ...allReviews,
    ...allUsers,
  ]);
  // Debug info
  LogInfo("Database fully indexed.");
  return miniSearch;
}

export { global_lookup, initialize_engine };
