/**
 * @file apps/api/src/grpc/server.ts
 * @contents Constructs and starts the gRPC server; registers all protobuf services and handlers.
 * @use Started from API process entry (`index.ts` or equivalent runtime).
 */

import {
	AdminService,
	AuthService,
	BookmarksService,
	CommentsService,
	FeedService,
	FollowsService,
	LikesService,
	NotificationsService,
	PostsService,
	SearchService,
	UsersService,
} from "@chirp/proto";
import { Server, ServerCredentials } from "@grpc/grpc-js";
import { adaptService } from "@protobuf-ts/grpc-backend";
import { logger } from "../lib/logger";
import { adminHandler } from "./handlers/admin.handler";
import { authHandler } from "./handlers/auth.handler";
import { bookmarksHandler } from "./handlers/bookmarks.handler";
import { commentsHandler } from "./handlers/comments.handler";
import { feedHandler } from "./handlers/feed.handler";
import { followsHandler } from "./handlers/follows.handler";
import { likesHandler } from "./handlers/likes.handler";
import { notificationsHandler } from "./handlers/notifications.handler";
import { postsHandler } from "./handlers/posts.handler";
import { searchHandler } from "./handlers/search.handler";
import { wrapHandler } from "./wrap-handler";
import { usersHandler } from "./handlers/users.handler";

export function startGrpcServer(port: number): Promise<Server> {
	const server = new Server();

	// Register all service handlers
	server.addService(...adaptService(AuthService, wrapHandler("AuthService", authHandler)));
	server.addService(...adaptService(PostsService, wrapHandler("PostsService", postsHandler)));
	server.addService(...adaptService(CommentsService, wrapHandler("CommentsService", commentsHandler)));
	server.addService(...adaptService(LikesService, wrapHandler("LikesService", likesHandler)));
	server.addService(...adaptService(FollowsService, wrapHandler("FollowsService", followsHandler)));
	server.addService(...adaptService(FeedService, wrapHandler("FeedService", feedHandler)));
	server.addService(...adaptService(SearchService, wrapHandler("SearchService", searchHandler)));
	server.addService(...adaptService(UsersService, wrapHandler("UsersService", usersHandler)));
	server.addService(...adaptService(AdminService, wrapHandler("AdminService", adminHandler)));
	server.addService(
		...adaptService(
			NotificationsService,
			wrapHandler("NotificationsService", notificationsHandler),
		),
	);
	server.addService(
		...adaptService(BookmarksService, wrapHandler("BookmarksService", bookmarksHandler)),
	);

	return new Promise((resolve, reject) => {
		server.bindAsync(`0.0.0.0:${port}`, ServerCredentials.createInsecure(), (error, boundPort) => {
			if (error) {
				logger.error("grpc.server.bind_failed", { port, error: error.message });
				reject(error);
				return;
			}
			logger.info("grpc.server.bound", { port: boundPort });
			resolve(server);
		});
	});
}
