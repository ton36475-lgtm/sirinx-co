CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(50) NOT NULL,
	`action` varchar(100) NOT NULL,
	`label` varchar(255),
	`value` int,
	`pagePath` varchar(500),
	`visitorId` varchar(64),
	`sessionId` varchar(64),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`path` varchar(500) NOT NULL,
	`referrer` text,
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`visitorId` varchar(64),
	`sessionId` varchar(64),
	`userAgent` text,
	`deviceType` varchar(20),
	`country` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
