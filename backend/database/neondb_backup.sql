--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-17 13:41:19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS "neondb";
--
-- TOC entry 3454 (class 1262 OID 16389)
-- Name: neondb; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE "neondb" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = builtin LOCALE = 'C.UTF-8' BUILTIN_LOCALE = 'C.UTF-8';


\connect "neondb"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 16481)
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "neon_auth";


--
-- TOC entry 7 (class 2615 OID 82088)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- TOC entry 2 (class 3079 OID 82163)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "public";


--
-- TOC entry 3455 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 894 (class 1247 OID 122881)
-- Name: retro_format_types; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."retro_format_types" AS ENUM (
    'format_1',
    'format_2',
    'format_3'
);


--
-- TOC entry 891 (class 1247 OID 98312)
-- Name: retro_formats; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."retro_formats" AS ENUM (
    'happy_sad_confused',
    'start_stop_continue'
);


--
-- TOC entry 897 (class 1247 OID 139265)
-- Name: retro_phases; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."retro_phases" AS ENUM (
    'prime-directive',
    'grouping',
    'labelling',
    'voting',
    'final',
    'ActionItems',
    'ideation'
);


--
-- TOC entry 888 (class 1247 OID 98305)
-- Name: retro_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."retro_status" AS ENUM (
    'ongoing',
    'draft',
    'completed'
);


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- TOC entry 219 (class 1259 OID 16482)
-- Name: users_sync; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE "neon_auth"."users_sync" (
    "raw_json" "jsonb" NOT NULL,
    "id" "text" GENERATED ALWAYS AS (("raw_json" ->> 'id'::"text")) STORED NOT NULL,
    "name" "text" GENERATED ALWAYS AS (("raw_json" ->> 'display_name'::"text")) STORED,
    "email" "text" GENERATED ALWAYS AS (("raw_json" ->> 'primary_email'::"text")) STORED,
    "created_at" timestamp with time zone GENERATED ALWAYS AS ("to_timestamp"(("trunc"(((("raw_json" ->> 'signed_up_at_millis'::"text"))::bigint)::double precision) / (1000)::double precision))) STORED,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


--
-- TOC entry 220 (class 1259 OID 82089)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 155649)
-- Name: action_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."action_items" (
    "id" integer NOT NULL,
    "retro_id" character varying,
    "assign_to" "text",
    "action_item" "text"
);


--
-- TOC entry 228 (class 1259 OID 155648)
-- Name: action_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE "public"."action_items" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."action_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 163841)
-- Name: group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."group" (
    "id" integer NOT NULL,
    "label" character varying(20),
    "votes" integer,
    "retro_id" character varying
);


--
-- TOC entry 230 (class 1259 OID 163840)
-- Name: group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE "public"."group" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 131074)
-- Name: group_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."group_item" (
    "id" integer NOT NULL,
    "label" "text" DEFAULT 'unlabeled'::"text",
    "item_id" "uuid",
    "group_id" integer
);


--
-- TOC entry 226 (class 1259 OID 131073)
-- Name: labels_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE "public"."group_item" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."labels_group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 82116)
-- Name: participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."participants" (
    "id" integer NOT NULL,
    "role" boolean DEFAULT false NOT NULL,
    "joined_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "retro_id" character varying NOT NULL,
    "user_id" "uuid" NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 82115)
-- Name: participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."participants_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3456 (class 0 OID 0)
-- Dependencies: 223
-- Name: participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."participants_id_seq" OWNED BY "public"."participants"."id";


--
-- TOC entry 225 (class 1259 OID 82127)
-- Name: retro_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."retro_items" (
    "content" "text" NOT NULL,
    "retro_id" character varying NOT NULL,
    "created_by" "uuid",
    "format_type" "public"."retro_format_types",
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "is_edited" boolean DEFAULT false
);


--
-- TOC entry 222 (class 1259 OID 82106)
-- Name: retros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."retros" (
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" character varying NOT NULL,
    "title" character varying(255) NOT NULL,
    "created_by" "uuid",
    "status" "public"."retro_status" NOT NULL,
    "format" "public"."retro_formats" NOT NULL,
    "current_phase" "public"."retro_phases",
    "facilitator" "uuid"
);


--
-- TOC entry 221 (class 1259 OID 82098)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."users" (
    "image_url" "text",
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "email" character varying NOT NULL,
    "name" character varying NOT NULL
);


--
-- TOC entry 3255 (class 2604 OID 82119)
-- Name: participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."participants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."participants_id_seq"'::"regclass");


--
-- TOC entry 3436 (class 0 OID 16482)
-- Dependencies: 219
-- Data for Name: users_sync; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY "neon_auth"."users_sync" ("raw_json", "updated_at", "deleted_at") FROM stdin;
\.


--
-- TOC entry 3437 (class 0 OID 82089)
-- Dependencies: 220
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") FROM stdin;
c2aaa6da-9017-49cb-b386-72a00bba0689	1b9c41ae88d93e3da6a7603152c0ddaaa1fee02e290e8a670d8f73c71d73fc0b	2025-07-06 15:30:14.474884+00	20250706152718_fix_user_id_auto_generation	\N	\N	2025-07-06 15:30:14.334449+00	1
\.


--
-- TOC entry 3446 (class 0 OID 155649)
-- Dependencies: 229
-- Data for Name: action_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."action_items" ("id", "retro_id", "assign_to", "action_item") FROM stdin;
\.


--
-- TOC entry 3448 (class 0 OID 163841)
-- Dependencies: 231
-- Data for Name: group; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."group" ("id", "label", "votes", "retro_id") FROM stdin;
\.


--
-- TOC entry 3444 (class 0 OID 131074)
-- Dependencies: 227
-- Data for Name: group_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."group_item" ("id", "label", "item_id", "group_id") FROM stdin;
\.


--
-- TOC entry 3441 (class 0 OID 82116)
-- Dependencies: 224
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."participants" ("id", "role", "joined_at", "retro_id", "user_id") FROM stdin;
\.


--
-- TOC entry 3442 (class 0 OID 82127)
-- Dependencies: 225
-- Data for Name: retro_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."retro_items" ("content", "retro_id", "created_by", "format_type", "id", "is_edited") FROM stdin;
\.


--
-- TOC entry 3439 (class 0 OID 82106)
-- Dependencies: 222
-- Data for Name: retros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."retros" ("created_at", "updated_at", "id", "title", "created_by", "status", "format", "current_phase", "facilitator") FROM stdin;
\.


--
-- TOC entry 3438 (class 0 OID 82098)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."users" ("image_url", "id", "email", "name") FROM stdin;
\.


--
-- TOC entry 3457 (class 0 OID 0)
-- Dependencies: 228
-- Name: action_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."action_items_id_seq"', 132, true);


--
-- TOC entry 3458 (class 0 OID 0)
-- Dependencies: 230
-- Name: group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."group_id_seq"', 377, true);


--
-- TOC entry 3459 (class 0 OID 0)
-- Dependencies: 226
-- Name: labels_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."labels_group_id_seq"', 576, true);


--
-- TOC entry 3460 (class 0 OID 0)
-- Dependencies: 223
-- Name: participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."participants_id_seq"', 780, true);


--
-- TOC entry 3263 (class 2606 OID 16492)
-- Name: users_sync users_sync_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY "neon_auth"."users_sync"
    ADD CONSTRAINT "users_sync_pkey" PRIMARY KEY ("id");


--
-- TOC entry 3267 (class 2606 OID 82181)
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id");


--
-- TOC entry 3269 (class 2606 OID 82183)
-- Name: retros PK_f9e2e230ada844ba49f2c006859; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retros"
    ADD CONSTRAINT "PK_f9e2e230ada844ba49f2c006859" PRIMARY KEY ("id");


--
-- TOC entry 3265 (class 2606 OID 82097)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");


--
-- TOC entry 3278 (class 2606 OID 155655)
-- Name: action_items action_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."action_items"
    ADD CONSTRAINT "action_items_pkey" PRIMARY KEY ("id");


--
-- TOC entry 3280 (class 2606 OID 163845)
-- Name: group group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."group"
    ADD CONSTRAINT "group_pkey" PRIMARY KEY ("id");


--
-- TOC entry 3276 (class 2606 OID 131080)
-- Name: group_item labels_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."group_item"
    ADD CONSTRAINT "labels_group_pkey" PRIMARY KEY ("id");


--
-- TOC entry 3271 (class 2606 OID 82125)
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."participants"
    ADD CONSTRAINT "participants_pkey" PRIMARY KEY ("id");


--
-- TOC entry 3274 (class 2606 OID 122889)
-- Name: retro_items retro_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retro_items"
    ADD CONSTRAINT "retro_items_pkey" PRIMARY KEY ("id");


--
-- TOC entry 3261 (class 1259 OID 16493)
-- Name: users_sync_deleted_at_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "users_sync_deleted_at_idx" ON "neon_auth"."users_sync" USING "btree" ("deleted_at");


--
-- TOC entry 3272 (class 1259 OID 114690)
-- Name: uniquq_retro_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "uniquq_retro_user" ON "public"."participants" USING "btree" ("retro_id", "user_id");


--
-- TOC entry 3283 (class 2606 OID 82212)
-- Name: participants FK_1427a77e06023c250ed3794a1ba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."participants"
    ADD CONSTRAINT "FK_1427a77e06023c250ed3794a1ba" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- TOC entry 3285 (class 2606 OID 122911)
-- Name: retro_items FK_477e6c6ab10e147c36743d38f01; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retro_items"
    ADD CONSTRAINT "FK_477e6c6ab10e147c36743d38f01" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3286 (class 2606 OID 122906)
-- Name: retro_items FK_7569f2040dfdb60cb7c42d18cbd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retro_items"
    ADD CONSTRAINT "FK_7569f2040dfdb60cb7c42d18cbd" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3284 (class 2606 OID 82207)
-- Name: participants FK_758567c141b72c3a3e2777de62e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."participants"
    ADD CONSTRAINT "FK_758567c141b72c3a3e2777de62e" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON DELETE CASCADE;


--
-- TOC entry 3281 (class 2606 OID 90117)
-- Name: retros FK_afb8daf8d7898e3ce86adfacfd6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retros"
    ADD CONSTRAINT "FK_afb8daf8d7898e3ce86adfacfd6" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3290 (class 2606 OID 163850)
-- Name: group constraint_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."group"
    ADD CONSTRAINT "constraint_1" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3287 (class 2606 OID 163855)
-- Name: group_item constraint_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."group_item"
    ADD CONSTRAINT "constraint_1" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id");


--
-- TOC entry 3289 (class 2606 OID 188416)
-- Name: action_items constraint_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."action_items"
    ADD CONSTRAINT "constraint_1" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3288 (class 2606 OID 131086)
-- Name: group_item constraint_2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."group_item"
    ADD CONSTRAINT "constraint_2" FOREIGN KEY ("item_id") REFERENCES "public"."retro_items"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3282 (class 2606 OID 196608)
-- Name: retros ffacil; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retros"
    ADD CONSTRAINT "ffacil" FOREIGN KEY ("facilitator") REFERENCES "public"."users"("id");


-- Completed on 2025-07-17 13:41:22

--
-- PostgreSQL database dump complete
--

