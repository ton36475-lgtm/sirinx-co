CREATE TABLE `automationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module` enum('lead_scoring','broadcast_followup','campaign_optimizer','crm_summary') NOT NULL,
	`status` enum('queued','running','completed','failed','review_required') NOT NULL DEFAULT 'queued',
	`targetEntityType` enum('campaign','lead','segment','system') NOT NULL DEFAULT 'system',
	`targetEntityId` int,
	`plannedActions` int NOT NULL DEFAULT 0,
	`actualActions` int NOT NULL DEFAULT 0,
	`expectedResult` text,
	`actualResult` text,
	`reviewNotes` text,
	`startedAt` timestamp,
	`finishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcastQueues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`sourceSystem` enum('broadpung','manual','system') NOT NULL DEFAULT 'manual',
	`channel` enum('line','telegram','sms','other') NOT NULL DEFAULT 'other',
	`status` enum('draft','ready','running','paused','completed') NOT NULL DEFAULT 'draft',
	`segmentLabel` varchar(160),
	`scheduledAt` timestamp,
	`sentCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`conversionCount` int NOT NULL DEFAULT 0,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcastQueues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`channel` enum('ad','organic','affiliate','broadcast','crm','manual') NOT NULL,
	`status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`landingPath` varchar(255),
	`budget` decimal(12,2),
	`spend` decimal(12,2) NOT NULL DEFAULT '0.00',
	`targetCpa` decimal(12,2),
	`targetRoi` decimal(10,2),
	`objective` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaigns_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `customerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`assignedUserId` int,
	`vipLevel` enum('prospect','vip','vvip','whale') NOT NULL DEFAULT 'prospect',
	`cumulativeDeposit` decimal(12,2) NOT NULL DEFAULT '0.00',
	`lifetimeRevenue` decimal(12,2) NOT NULL DEFAULT '0.00',
	`followUpStatus` enum('pending','active','nurturing','retained','churn_risk','closed') NOT NULL DEFAULT 'pending',
	`preferredLottery` varchar(160),
	`affordabilityBand` enum('unknown','mid','high','whale') NOT NULL DEFAULT 'unknown',
	`segmentLabel` varchar(160),
	`lastContactAt` timestamp,
	`nextFollowUpAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerProfiles_leadId_unique` UNIQUE(`leadId`)
);
--> statement-breakpoint
CREATE TABLE `depositEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`campaignId` int,
	`depositType` enum('first','repeat','manual_adjustment') NOT NULL DEFAULT 'repeat',
	`amount` decimal(12,2) NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `depositEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`campaignId` int,
	`eventType` enum('page_view','form_submit','contact','register','deposit','status_change','note_added','ai_action','broadcast_sent','broadcast_reply') NOT NULL,
	`eventSource` enum('system','user','ai','import','api') NOT NULL DEFAULT 'system',
	`valueAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`fullName` varchar(160),
	`phone` varchar(32),
	`lineId` varchar(64),
	`telegramHandle` varchar(64),
	`sourceType` enum('ad','organic','direct','affiliate','broadcast','manual') NOT NULL DEFAULT 'manual',
	`leadStatus` enum('new','contacted','qualified','registered','depositing','converted','lost') NOT NULL DEFAULT 'new',
	`vipTier` enum('standard','vip','vvip','whale') NOT NULL DEFAULT 'standard',
	`landingPage` varchar(255),
	`referrer` varchar(255),
	`deviceType` enum('mobile','desktop','tablet','unknown') NOT NULL DEFAULT 'unknown',
	`utmSource` varchar(120),
	`utmMedium` varchar(120),
	`utmCampaign` varchar(120),
	`utmContent` varchar(120),
	`utmTerm` varchar(120),
	`primaryIntent` varchar(120),
	`predictedValueScore` decimal(6,2) NOT NULL DEFAULT '0.00',
	`acquisitionCost` decimal(12,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`firstDepositAt` timestamp,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vipNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`authorUserId` int,
	`noteType` enum('call','chat','deposit','insight','reminder','system') NOT NULL DEFAULT 'insight',
	`content` text NOT NULL,
	`nextActionAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vipNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customerProfiles` ADD CONSTRAINT `customerProfiles_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customerProfiles` ADD CONSTRAINT `customerProfiles_assignedUserId_users_id_fk` FOREIGN KEY (`assignedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `depositEvents` ADD CONSTRAINT `depositEvents_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `depositEvents` ADD CONSTRAINT `depositEvents_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadEvents` ADD CONSTRAINT `leadEvents_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadEvents` ADD CONSTRAINT `leadEvents_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_campaignId_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vipNotes` ADD CONSTRAINT `vipNotes_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vipNotes` ADD CONSTRAINT `vipNotes_authorUserId_users_id_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;