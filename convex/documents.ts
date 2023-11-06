import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const archive = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Note not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });
        await recursiveArchive(child._id);
      }
    };
    recursiveArchive(args.id);
    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });
    return true;
  },
});

export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) throw new Error("Not authenticated");

    const userId = identitiy.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentDocument", args.parentDocument)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

export const get = query({
  handler: async (ctx) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) throw new Error("Not authenticated");

    const documents = await ctx.db.query("documents").collect();

    return documents;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userId,
      isArchived: false,
      isPublished: false,
    });
    return document;
  },
});

export const getTrash = query({
  handler: async (ctx) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

export const restore = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Note not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const recursiveRestore = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });
        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    if (existingDocument.parentDocument) {
      options.parentDocument = undefined;
    }

    const document = await ctx.db.patch(args.id, options);

    await recursiveRestore(args.id);

    return document;
  },
});

export const remove = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Note not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.delete(args.id);

    return document;
  },
});

export const getSearch = query({
  handler: async (ctx) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();
    return documents;
  },
});

export const getById = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identitiy = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      throw new Error("Note not found");
    }

    if (document.isPublished && !document.isArchived) {
      return document;
    }

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    if (document.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return document;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.string(),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identitiy = await ctx.auth.getUserIdentity();

    if (!identitiy) {
      throw new Error("Not authenticated");
    }

    const userId = identitiy.subject;

    const { id, ...rest } = args;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Note not found");
    }
     
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, {...rest});
    
  },
});
