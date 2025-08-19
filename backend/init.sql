--
-- PostgreSQL database dump
--
-- CATATAN: Semua baris 'SET' yang tidak kompatibel sudah dihapus dan format data COPY sudah diperbaiki.
--

CREATE TABLE public.mentor_salaries (
    salary_id integer NOT NULL,
    mentor_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_period_start date NOT NULL,
    payment_period_end date NOT NULL,
    payment_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    paid_by_admin integer NOT NULL
);
ALTER TABLE public.mentor_salaries OWNER TO postgres;

CREATE SEQUENCE public.mentor_salaries_salary_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.mentor_salaries_salary_id_seq OWNER TO postgres;
ALTER SEQUENCE public.mentor_salaries_salary_id_seq OWNED BY public.mentor_salaries.salary_id;

CREATE TABLE public.packages (
    package_id integer NOT NULL,
    package_name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    total_sessions integer NOT NULL,
    duration_days integer NOT NULL,
    curriculum character varying(50),
    CONSTRAINT packages_curriculum_check CHECK (((curriculum)::text = ANY ((ARRAY['nasional'::character varying, 'nasional_plus'::character varying, 'internasional'::character varying, 'olimpiade'::character varying, 'utbk'::character varying, 'mahasiswa'::character varying, 'tahsin'::character varying])::text[])))
);
ALTER TABLE public.packages OWNER TO postgres;

CREATE SEQUENCE public.packages_package_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.packages_package_id_seq OWNER TO postgres;
ALTER SEQUENCE public.packages_package_id_seq OWNED BY public.packages.package_id;

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    user_package_id integer NOT NULL,
    student_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_proof_url text,
    payment_date timestamp with time zone,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    verified_by integer,
    verified_at timestamp with time zone,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[])))
);
ALTER TABLE public.payments OWNER TO postgres;

CREATE SEQUENCE public.payments_payment_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.payments_payment_id_seq OWNER TO postgres;
ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;

CREATE TABLE public.schedules (
    schedule_id integer NOT NULL,
    user_package_id integer,
    student_id integer NOT NULL,
    mentor_id integer,
    session_datetime timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    zoom_link text,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT schedules_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'pending_approval'::character varying])::text[])))


);
ALTER TABLE public.schedules OWNER TO postgres;

CREATE SEQUENCE public.schedules_schedule_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.schedules_schedule_id_seq OWNER TO postgres;
ALTER SEQUENCE public.schedules_schedule_id_seq OWNED BY public.schedules.schedule_id;

CREATE TABLE public.session_reports (
    report_id integer NOT NULL,
    schedule_id integer NOT NULL,
    mentor_id integer NOT NULL,
    student_id integer NOT NULL,
    summary text NOT NULL,
    student_development_journal text,
    student_attended boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    verified_by_admin boolean DEFAULT false,
    payroll_status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    CONSTRAINT check_payroll_status CHECK (((payroll_status)::text = ANY ((ARRAY['unpaid'::character varying, 'paid'::character varying])::text[])))
);
ALTER TABLE public.session_reports OWNER TO postgres;
ALTER TABLE public.session_reports ADD COLUMN material_url TEXT;

CREATE SEQUENCE public.session_reports_report_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.session_reports_report_id_seq OWNER TO postgres;
ALTER SEQUENCE public.session_reports_report_id_seq OWNED BY public.session_reports.report_id;

CREATE TABLE public.user_packages (
    user_package_id integer NOT NULL,
    student_id integer NOT NULL,
    package_id integer NOT NULL,
    mentor_id integer,
    purchase_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    activation_date timestamp with time zone,
    expiry_date timestamp with time zone,
    remaining_sessions integer NOT NULL,
    status character varying(20) NOT NULL,
    CONSTRAINT user_packages_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'expired'::character varying, 'finished'::character varying])::text[])))
);
ALTER TABLE public.user_packages OWNER TO postgres;
ALTER TABLE user_packages ADD COLUMN schedule_recommendation TEXT;

CREATE SEQUENCE public.user_packages_user_package_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.user_packages_user_package_id_seq OWNER TO postgres;
ALTER SEQUENCE public.user_packages_user_package_id_seq OWNED BY public.user_packages.user_package_id;

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone_number character varying(20),
    role character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    salary_rate numeric(10,2) DEFAULT 0,
    payment_type character varying(20) DEFAULT 'monthly'::character varying NOT NULL,
    CONSTRAINT check_payment_type CHECK (((payment_type)::text = ANY ((ARRAY['monthly'::character varying, 'daily'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'mentor'::character varying, 'siswa'::character varying])::text[])))
);
ALTER TABLE public.users OWNER TO postgres;

CREATE SEQUENCE public.users_user_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;
ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;

ALTER TABLE ONLY public.mentor_salaries ALTER COLUMN salary_id SET DEFAULT nextval('public.mentor_salaries_salary_id_seq'::regclass);
ALTER TABLE ONLY public.packages ALTER COLUMN package_id SET DEFAULT nextval('public.packages_package_id_seq'::regclass);
ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);
ALTER TABLE ONLY public.schedules ALTER COLUMN schedule_id SET DEFAULT nextval('public.schedules_schedule_id_seq'::regclass);
ALTER TABLE ONLY public.session_reports ALTER COLUMN report_id SET DEFAULT nextval('public.session_reports_report_id_seq'::regclass);
ALTER TABLE ONLY public.user_packages ALTER COLUMN user_package_id SET DEFAULT nextval('public.user_packages_user_package_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);

COPY public.mentor_salaries (salary_id, mentor_id, amount, payment_period_start, payment_period_end, payment_date, paid_by_admin) FROM stdin;
\.

COPY public.packages (package_id, package_name, description, price, total_sessions, duration_days, curriculum) FROM stdin;
3	Paket Reguler Lama	Paket historis	200000.00	8	30	nasional
4	Paket UTBK Lama	Paket historis	350000.00	12	30	utbk
2	Nasional	Coba	250000.00	12	12	nasional
1	Paket Merah Putih	Paket untuk testing	100000.00	12	10	nasional
7	Paket One for All	bagus	100000.00	9	8	nasional
\.

COPY public.payments (payment_id, user_package_id, student_id, amount, payment_proof_url, payment_date, status, verified_by, verified_at) FROM stdin;
4	21	17	100000.00	uploads/paymentProof-1754495472671.png	2025-08-06 22:51:12.678644+07	verified	2	2025-08-06 22:52:39.216458+07
5	22	18	100000.00	uploads/paymentProof-1754534353790.png	2025-08-07 09:39:13.963081+07	verified	2	2025-08-07 09:41:17.302321+07
7	30	19	100000.00	uploads/paymentProof-1754535827718.png	2025-08-07 10:03:47.930542+07	verified	2	2025-08-07 10:04:46.508675+07
8	31	20	200000.00	uploads/paymentProof-1754539948243.png	2025-08-07 11:12:28.311818+07	verified	2	2025-08-07 11:12:55.339505+07
9	32	22	100000.00	uploads/paymentProof-1754540907116.png	2025-08-07 11:28:27.13461+07	verified	2	2025-08-07 11:29:03.441843+07
13	36	26	100000.00	uploads/paymentProof-1755093603082.png	2025-08-13 21:00:03.088541+07	verified	2	2025-08-13 21:04:51.911257+07
6	29	1	350000.00	\N	2025-08-07 09:51:23.632127+07	verified	2	2025-08-13 21:10:46.213068+07
14	37	26	200000.00	uploads/paymentProof-1755094307575.png	2025-08-13 21:11:47.592758+07	verified	2	2025-08-13 21:12:27.681451+07
\.

COPY public.schedules (schedule_id, user_package_id, student_id, mentor_id, session_datetime, duration_minutes, zoom_link, status, created_at) FROM stdin;
14	21	17	3	2025-08-07 00:30:00+07	60	\N	scheduled	2025-08-09 11:21:06.264701+07
15	22	18	3	2025-08-07 06:41:00+07	60	\N	scheduled	2025-08-09 11:21:06.264701+07
16	30	19	3	2025-08-07 09:30:00+07	60	\N	scheduled	2025-08-09 11:21:06.264701+07
17	31	20	3	2025-08-07 03:13:00+07	60	\N	scheduled	2025-08-09 11:21:06.264701+07
18	27	1	21	2025-08-07 04:17:00+07	60	\N	scheduled	2025-08-09 11:21:06.264701+07
19	32	22	21	2025-08-08 11:30:00+07	60	https://meet.google.com/enx-vejz-ajf	scheduled	2025-08-09 11:21:06.264701+07
30	36	26	3	2025-08-13 21:30:00+07	60	\N	scheduled	2025-08-13 21:23:28.865378+07
28	36	26	3	2025-08-13 14:30:00+07	60	\N	scheduled	2025-08-13 21:14:32.854286+07
29	37	26	3	2025-08-14 09:30:00+07	60	https://meet.google.com/vmb-nnsx-sat	scheduled	2025-08-13 21:17:05.141646+07
31	36	26	3	2025-08-13 21:50:00+07	60	https://meet.google.com/vmb-nnsx-sat	scheduled	2025-08-13 21:40:48.785572+07
32	36	26	3	2025-08-14 14:00:00+07	60	https://meet.google.com/vmb-nnsx-sat	scheduled	2025-08-14 13:43:29.762677+07
33	37	26	\N	2025-08-14 15:00:00+07	60	\N	pending_approval	2025-08-14 14:27:19.757838+07
\.

COPY public.session_reports (report_id, schedule_id, mentor_id, student_id, summary, student_development_journal, student_attended, created_at, verified_by_admin, payroll_status) FROM stdin;
3	18	21	1	Mantap	lumayan	t	2025-08-10 22:37:04.765236+07	t	unpaid
4	31	3	26	Mantap	menunjukkan perkembangan	t	2025-08-13 21:51:42.702084+07	t	paid
\.

COPY public.user_packages (user_package_id, student_id, package_id, purchase_date, activation_date, expiry_date, remaining_sessions, status) FROM stdin;
21	17	1	2025-08-06 22:51:12.678644+07	2025-08-06 22:52:39.216458+07	\N	12	active
22	18	1	2025-08-07 09:39:13.963081+07	2025-08-07 09:41:17.302321+07	\N	12	active
26	1	3	2025-06-07 09:51:23.632127+07	2025-06-07 09:51:23.632127+07	2025-07-07 09:51:23.632127+07	0	finished
28	1	1	2025-04-07 09:51:23.632127+07	2025-04-07 09:51:23.632127+07	2025-05-07 09:51:23.632127+07	5	expired
30	19	1	2025-08-07 10:03:47.930542+07	2025-08-07 10:04:46.508675+07	\N	12	active
31	20	3	2025-08-07 11:12:28.311818+07	2025-08-07 11:12:55.339505+07	\N	8	active
32	22	1	2025-08-07 11:28:27.13461+07	2025-08-07 11:29:03.441843+07	\N	12	active
27	1	2	2025-07-23 09:51:23.632127+07	2025-07-23 09:51:23.632127+07	2025-08-22 09:51:23.632127+07	9	active
29	1	4	2025-08-07 09:51:23.632127+07	2025-08-13 21:10:46.213068+07	\N	12	active
37	26	3	2025-08-13 21:11:47.592758+07	2025-08-13 21:12:27.681451+07	\N	8	active
36	26	1	2025-08-13 21:00:03.088541+07	2025-08-13 21:04:51.911257+07	\N	11	active
\.

COPY public.users (user_id, full_name, email, password_hash, phone_number, role, created_at, salary_rate, payment_type) FROM stdin;
2	Admin Satu	admin@email.com	$2b$10$wYDiNBWNU4f.6DsvOPQWjuHYP1scHKkGc9Qb/m8oJTAGLhmmgzJ4K	08123456787	admin	2025-08-02 10:23:01.596169+07	0.00	monthly
4	Syawal Saputra	syawal2011016065@webmail.uad.ac.id	$2b$10$wXzmoH3AThAC.z7NoLeuH.GhaBn3KRoRXig85Ol3oOJ.qbuB0vYtS	085215067556	mentor	2025-08-04 19:23:22.76445+07	0.00	monthly
17	siswamuin	siswamuin123@email.com	$2b$10$MrNEkKsd.1QXkuvFfjcVOu4PzekvyopNIMo/ouOhnbI7dnwJd4WZu	08123456789	siswa	2025-08-06 22:50:43.251354+07	0.00	monthly
19	SiswaMuin23	siswamuin125@email.com	$2b$10$A7IbA92tHFZJISamKE6VqeM0Sdw25jm.xgVEWuFt8To9AyNOo51qm	087665678999	siswa	2025-08-07 10:02:10.728214+07	0.00	monthly
20	SiswaMuin25	siswamuin126@email.com	$2b$10$ad8GwoA3URbHJcAIPc1RBeW7eFyF/lN19xVNfEhow6WWT1lOEzVLy	087665678999	siswa	2025-08-07 11:11:47.334008+07	0.00	monthly
21	syawalsss	syawalsss@email.com	$2b$10$eyTkkE1FIatzDlR9SrbF5ujiNrvw6KRdTddlhF4W10OgdxEmhRv6C	08123456789	mentor	2025-08-07 11:17:18.753968+07	0.00	monthly
22	syawal	syawalaja0712@gmail.com	$2b$10$89hqRecUnbApRfMZOnpCxOySFm9NxOfaq.RCk72kpkYNADzciDhZS	085215067556	siswa	2025-08-07 11:27:10.212201+07	0.00	monthly
1	Siswa Pertama	siswa.pertama@email.com	$2b$10$9ufxB3GUyoHszKWZxW0dSeE6GqPq.h4iqKyXW5X6HlnlruoSRqhl.	6285215067556	siswa	2025-07-31 10:02:28.254673+07	0.00	monthly
26	Putra Syawal	putras@email.com	$2b$10$R3EDOrvufHFCUvod.Cu28uKM563a5vOB1b7mSJWzvqJkGncK8Ry9G	085215067556	siswa	2025-08-13 20:59:38.652941+07	0.00	monthly
3	Mentor Satu	mentor@email.com	$2b$10$9uWBCfDDw36z84kThTUlm.Jg4uaMAqfdyRxl/REKX66glzQwDRLiW	08123456789	mentor	2025-08-02 10:28:34.490099+07	35000.00	daily
18	siswamuin1918	siswamuin124@email.com	$2b$10$OS/1pzUNGzni80ogxkbDeuvNA4zmzT.P5RU/fe7s1lTnl55YwG24C	08123456789	siswa	2025-08-07 09:37:01.398924+07	0.00	monthly
\.

SELECT pg_catalog.setval('public.mentor_salaries_salary_id_seq', 1, false);
SELECT pg_catalog.setval('public.packages_package_id_seq', 7, true);
SELECT pg_catalog.setval('public.payments_payment_id_seq', 14, true);
SELECT pg_catalog.setval('public.schedules_schedule_id_seq', 33, true);
SELECT pg_catalog.setval('public.session_reports_report_id_seq', 4, true);
SELECT pg_catalog.setval('public.user_packages_user_package_id_seq', 37, true);
SELECT pg_catalog.setval('public.users_user_id_seq', 26, true);

ALTER TABLE ONLY public.mentor_salaries ADD CONSTRAINT mentor_salaries_pkey PRIMARY KEY (salary_id);
ALTER TABLE ONLY public.packages ADD CONSTRAINT packages_pkey PRIMARY KEY (package_id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);
ALTER TABLE ONLY public.schedules ADD CONSTRAINT schedules_pkey PRIMARY KEY (schedule_id);
ALTER TABLE ONLY public.session_reports ADD CONSTRAINT session_reports_pkey PRIMARY KEY (report_id);
ALTER TABLE ONLY public.session_reports ADD CONSTRAINT unique_schedule_report UNIQUE (schedule_id);
ALTER TABLE ONLY public.user_packages ADD CONSTRAINT unique_student_package UNIQUE (student_id, package_id);
ALTER TABLE ONLY public.user_packages ADD CONSTRAINT user_packages_pkey PRIMARY KEY (user_package_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.mentor_salaries ADD CONSTRAINT mentor_salaries_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.mentor_salaries ADD CONSTRAINT mentor_salaries_paid_by_admin_fkey FOREIGN KEY (paid_by_admin) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_user_package_id_fkey FOREIGN KEY (user_package_id) REFERENCES public.user_packages(user_package_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.schedules ADD CONSTRAINT schedules_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.schedules ADD CONSTRAINT schedules_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.schedules ADD CONSTRAINT schedules_user_package_id_fkey FOREIGN KEY (user_package_id) REFERENCES public.user_packages(user_package_id);
ALTER TABLE ONLY public.session_reports ADD CONSTRAINT session_reports_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_reports ADD CONSTRAINT session_reports_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(schedule_id);
ALTER TABLE ONLY public.session_reports ADD CONSTRAINT session_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_packages ADD CONSTRAINT user_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(package_id);
ALTER TABLE ONLY public.user_packages ADD CONSTRAINT user_packages_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_packages ADD CONSTRAINT user_packages_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(user_id);
--
-- PostgreSQL database dump complete
--