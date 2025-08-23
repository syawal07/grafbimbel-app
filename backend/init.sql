--
-- PostgreSQL database dump
--

-- Bagian 1: Membuat semua tabel dan sekuens
-- ==================================================

CREATE TABLE public.mentor_salaries (
    salary_id integer NOT NULL,
    mentor_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_period_start date NOT NULL,
    payment_period_end date NOT NULL,
    payment_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    paid_by_admin integer NOT NULL
);

CREATE SEQUENCE public.mentor_salaries_salary_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
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

CREATE SEQUENCE public.packages_package_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
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

CREATE SEQUENCE public.payments_payment_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
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

CREATE SEQUENCE public.schedules_schedule_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
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

CREATE SEQUENCE public.session_reports_report_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
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

CREATE SEQUENCE public.user_packages_user_package_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.user_packages_user_package_id_seq OWNED BY public.user_packages.user_package_id;

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone_number character varying(20),
    nickname VARCHAR(50),      
    city VARCHAR(100),         
    school VARCHAR(100),       
    notes TEXT,
    role character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_type character varying(20) DEFAULT 'monthly'::character varying NOT NULL,
    CONSTRAINT check_payment_type CHECK (((payment_type)::text = ANY ((ARRAY['monthly'::character varying, 'daily'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'mentor'::character varying, 'siswa'::character varying])::text[])))
);

CREATE SEQUENCE public.users_user_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;

CREATE TABLE public.mentor_profiles (
    profile_id SERIAL PRIMARY KEY,
    mentor_id INT UNIQUE NOT NULL,
    nickname VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    domicile VARCHAR(255),
    profile_picture_url TEXT,
    last_education VARCHAR(100),
    major VARCHAR(100),
    expert_subjects TEXT[],
    teachable_levels TEXT[],
    teaching_experience TEXT,
    certificate_url TEXT,
    availability TEXT,
    max_teaching_hours INT,
    teaching_mode VARCHAR(50),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(50),
    id_card_number VARCHAR(50)
);

CREATE TABLE public.advantages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_svg TEXT
);

CREATE TABLE public.faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);


-- Bagian 2: Mengatur nilai default untuk kolom ID
-- ==================================================

ALTER TABLE ONLY public.mentor_salaries ALTER COLUMN salary_id SET DEFAULT nextval('public.mentor_salaries_salary_id_seq'::regclass);
ALTER TABLE ONLY public.packages ALTER COLUMN package_id SET DEFAULT nextval('public.packages_package_id_seq'::regclass);
ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);
ALTER TABLE ONLY public.schedules ALTER COLUMN schedule_id SET DEFAULT nextval('public.schedules_schedule_id_seq'::regclass);
ALTER TABLE ONLY public.session_reports ALTER COLUMN report_id SET DEFAULT nextval('public.session_reports_report_id_seq'::regclass);
ALTER TABLE ONLY public.user_packages ALTER COLUMN user_package_id SET DEFAULT nextval('public.user_packages_user_package_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


-- Bagian 3: Mendefinisikan semua Primary Key dan Unique Constraint
-- ==================================================

ALTER TABLE ONLY public.mentor_salaries ADD CONSTRAINT mentor_salaries_pkey PRIMARY KEY (salary_id);
ALTER TABLE ONLY public.packages ADD CONSTRAINT packages_pkey PRIMARY KEY (package_id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);
ALTER TABLE ONLY public.schedules ADD CONSTRAINT schedules_pkey PRIMARY KEY (schedule_id);
ALTER TABLE ONLY public.session_reports ADD CONSTRAINT session_reports_pkey PRIMARY KEY (report_id);
ALTER TABLE ONLY public.session_reports ADD CONSTRAINT unique_schedule_report UNIQUE (schedule_id);
ALTER TABLE ONLY public.user_packages ADD CONSTRAINT user_packages_pkey PRIMARY KEY (user_package_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


-- Bagian 4: Mendefinisikan semua Foreign Key
-- ==================================================

ALTER TABLE ONLY public.mentor_profiles ADD CONSTRAINT mentor_profiles_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
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


-- Bagian 5: Menjalankan semua ALTER TABLE lainnya
-- ==================================================

ALTER TABLE public.schedules ADD COLUMN session_rate NUMERIC(10, 2);
ALTER TABLE schedules ADD COLUMN mapel VARCHAR(100);
ALTER TABLE public.session_reports ADD COLUMN material_url TEXT;
ALTER TABLE user_packages ADD COLUMN schedule_recommendation TEXT;
ALTER TABLE public.user_packages ADD COLUMN session_rate NUMERIC(10, 2);


-- Bagian 6: Memasukkan data awal (COPY)
-- ==================================================

COPY public.packages (package_id, package_name, description, price, total_sessions, duration_days, curriculum) FROM stdin;
3	Paket Reguler Lama	Paket historis	200000.00	8	30	nasional
4	Paket UTBK Lama	Paket historis	350000.00	12	30	utbk
2	Nasional	Coba	250000.00	12	12	nasional
1	Paket Merah Putih	Paket untuk testing	100000.00	12	10	nasional
7	Paket One for All	bagus	100000.00	9	8	nasional
\.

COPY public.users (user_id, full_name, email, password_hash, phone_number, role, created_at, payment_type) FROM stdin;
2	Admin Satu	admin@email.com	$2b$10$wYDiNBWNU4f.6DsvOPQWjuHYP1scHKkGc9Qb/m8oJTAGLhmmgzJ4K	08123456787	admin	2025-08-02 10:23:01.596169+07	monthly
4	Syawal Saputra	syawal2011016065@webmail.uad.ac.id	$2b$10$wXzmoH3AThAC.z7NoLeuH.GhaBn3KRoRXig85Ol3oOJ.qbuB0vYtS	085215067556	mentor	2025-08-04 19:23:22.76445+07	monthly
17	siswamuin	siswamuin123@email.com	$2b$10$MrNEkKsd.1QXkuvFfjcVOu4PzekvyopNIMo/ouOhnbI7dnwJd4WZu	08123456789	siswa	2025-08-06 22:50:43.251354+07	monthly
19	SiswaMuin23	siswamuin125@email.com	$2b$10$A7IbA92tHFZJISamKE6VqeM0Sdw25jm.xgVEWuFt8To9AyNOo51qm	087665678999	siswa	2025-08-07 10:02:10.728214+07	monthly
20	SiswaMuin25	siswamuin126@email.com	$2b$10$ad8GwoA3URbHJcAIPc1RBeW7eFyF/lN19xVNfEhow6WWT1lOEzVLy	087665678999	siswa	2025-08-07 11:11:47.334008+07	monthly
21	syawalsss	syawalsss@email.com	$2b$10$eyTkkE1FIatzDlR9SrbF5ujiNrvw6KRdTddlhF4W10OgdxEmhRv6C	08123456789	mentor	2025-08-07 11:17:18.753968+07	monthly
22	syawal	syawalaja0712@gmail.com	$2b$10$89hqRecUnbApRfMZOnpCxOySFm9NxOfaq.RCk72kpkYNADzciDhZS	085215067556	siswa	2025-08-07 11:27:10.212201+07	monthly
1	Siswa Pertama	siswa.pertama@email.com	$2b$10$9ufxB3GUyoHszKWZxW0dSeE6GqPq.h4iqKyXW5X6HlnlruoSRqhl.	6285215067556	siswa	2025-07-31 10:02:28.254673+07	monthly
26	Putra Syawal	putras@email.com	$2b$10$R3EDOrvufHFCUvod.Cu28uKM563a5vOB1b7mSJWzvqJkGncK8Ry9G	085215067556	siswa	2025-08-13 20:59:38.652941+07	monthly
3	Mentor Satu	mentor@email.com	$2b$10$9uWBCfDDw36z84kThTUlm.Jg4uaMAqfdyRxl/REKX66glzQwDRLiW	08123456789	mentor	2025-08-02 10:28:34.490099+07	daily
18	siswamuin1918	siswamuin124@email.com	$2b$10$OS/1pzUNGzni80ogxkbDeuvNA4zmzT.P5RU/fe7s1lTnl55YwG24C	08123456789	siswa	2025-08-07 09:37:01.398924+07	monthly
\.


-- Bagian 7: Mengatur nilai sekuens
-- ==================================================

SELECT pg_catalog.setval('public.mentor_salaries_salary_id_seq', 1, false);
SELECT pg_catalog.setval('public.packages_package_id_seq', 7, true);
SELECT pg_catalog.setval('public.payments_payment_id_seq', 14, true);
SELECT pg_catalog.setval('public.schedules_schedule_id_seq', 33, true);
SELECT pg_catalog.setval('public.session_reports_report_id_seq', 4, true);
SELECT pg_catalog.setval('public.user_packages_user_package_id_seq', 37, true);
SELECT pg_catalog.setval('public.users_user_id_seq', 26, true);

--
-- PostgreSQL database dump complete
--
