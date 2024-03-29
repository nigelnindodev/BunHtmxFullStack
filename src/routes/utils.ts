import { DataSource } from "typeorm";
import { getUserById } from "../postgres/queries";
import {
    ServerAuthenticationError,
    ServerForbiddenError,
} from "../services/common/constants";

/**
 * Throws forbidden error on a route if the user is not an
 * admin user.
 *
 * Hate the use of any here, but it's only way to avoid adding
 * third party types whihc may be subject to change.
 */
export const forbidIfNotAdmin = async (
    dataSource: DataSource,
    ctx: any
): Promise<void> => {
    if ("userId" in ctx) {
        const user = await getUserById(dataSource, ctx.userId as number);
        if (user === null || !user.is_admin) {
            throw new ServerForbiddenError();
        }
    } else {
        throw new ServerForbiddenError();
    }
};

export const unauthorizedIfNotLoggedIn = (ctx: any): void => {
    // Any way to use negative type guard?
    if ("userId" in ctx) {
        if (ctx.userId === undefined) {
            throw new ServerAuthenticationError();
        }
    } else {
        throw new ServerAuthenticationError();
    }
};
