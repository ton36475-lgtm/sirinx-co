CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`excerpt` text,
	`content` text,
	`coverImage` text,
	`category` varchar(100),
	`tags` text,
	`author` varchar(255) DEFAULT 'SIRINX Team',
	`published` boolean NOT NULL DEFAULT false,
	`readTime` int DEFAULT 5,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`authorId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`formData` text NOT NULL,
	`sourcePage` varchar(100) DEFAULT 'contact',
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(32) NOT NULL DEFAULT 'contact',
	`status` enum('new','contacted','qualified','proposal','won','lost') NOT NULL DEFAULT 'new',
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`email` varchar(320),
	`phone` varchar(32),
	`industry` varchar(100),
	`interest` varchar(255),
	`budget` varchar(100),
	`timeline` varchar(100),
	`systemSize` varchar(50),
	`systemType` varchar(100),
	`monthlyBill` varchar(50),
	`bessInterest` varchar(10),
	`message` text,
	`adminNotes` text,
	`lineUserId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`location` varchar(255),
	`type` varchar(100),
	`capacity` varchar(100),
	`saving` varchar(255),
	`year` varchar(10),
	`description` text,
	`image` text,
	`galleryImages` text,
	`tag` varchar(50),
	`sortOrder` int DEFAULT 0,
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
