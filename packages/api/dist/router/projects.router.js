"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsRouter = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const zod_1 = require("zod");
const simple_git_1 = __importDefault(require("simple-git"));
const trpc_1 = require("./trpc");
exports.projectsRouter = trpc_1.t.router({
    list: trpc_1.t.procedure.query(async ({ ctx }) => {
        const root = await ctx.configService.get('projectsRoot');
        if (!root)
            return [];
        try {
            const entries = (0, fs_1.readdirSync)(root);
            return entries
                .filter((name) => {
                try {
                    return (0, fs_1.statSync)((0, path_1.join)(root, name)).isDirectory() && !name.startsWith('.');
                }
                catch {
                    return false;
                }
            })
                .map((name) => ({ name, path: (0, path_1.join)(root, name) }));
        }
        catch {
            return [];
        }
    }),
    branches: trpc_1.t.procedure
        .input(zod_1.z.object({ path: zod_1.z.string() }))
        .query(async ({ input }) => {
        const git = (0, simple_git_1.default)({ baseDir: input.path, timeout: { block: 5000 } });
        const isRepo = await git.checkIsRepo().catch(() => false);
        if (!isRepo)
            return { branches: [], isGitRepo: false };
        try {
            const result = await git.branchLocal();
            return { branches: result.all, isGitRepo: true };
        }
        catch {
            return { branches: [], isGitRepo: true };
        }
    }),
});
