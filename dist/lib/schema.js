"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterSchema = exports.dappSchema = void 0;
const zod_1 = require("zod");
// Schema for a single DApp
exports.dappSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1, { message: "Slug cannot be empty." }),
    name: zod_1.z.string().min(1, { message: "Name cannot be empty." }),
    description: zod_1.z.string().optional(),
    url: zod_1.z.string().url({ message: "Invalid URL format." }),
    logo: zod_1.z.string().min(1, { message: "Logo path/URL cannot be empty." }),
    category: zod_1.z.string().min(1, { message: "Category cannot be empty." }),
    chain: zod_1.z.string().min(1, { message: "Chain cannot be empty." }),
});
// Schema for the master.json file (an array of DApps)
exports.masterSchema = zod_1.z.array(exports.dappSchema);
