--
-- PostgreSQL database dump
--

-- \restrict 5e57UBipdr8XslzUpMc746u2Hh2tnCPRAKNphqUEQY0z1zR2GnhoeN1d0bgThhu

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-11-02 23:36:42

-- SET statement_timeout = 0;
-- SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
-- SET client_encoding = 'UTF8';
-- SET standard_conforming_strings = on;
-- SELECT pg_catalog.set_config('search_path', '', false);
-- SET check_function_bodies = false;
-- SET xmloption = content;
-- SET client_min_messages = warning;
-- SET row_security = off;

-- SET default_tablespace = '';

-- SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 33066)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    document_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    response text NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 33065)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- TOC entry 4931 (class 0 OID 0)
-- Dependencies: 223
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 220 (class 1259 OID 33036)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    user_id integer,
    filename character varying,
    original_filename character varying,
    file_path character varying,
    file_size integer,
    file_type character varying,
    uploaded_at timestamp without time zone,
    status character varying
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 33035)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 4932 (class 0 OID 0)
-- Dependencies: 219
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 222 (class 1259 OID 33052)
-- Name: extracted_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extracted_data (
    id integer NOT NULL,
    document_id integer NOT NULL,
    bill_id character varying,
    bill_type character varying,
    invoice_number character varying,
    order_id character varying,
    order_date character varying,
    invoice_date character varying,
    due_date character varying,
    payment_status character varying,
    customer json,
    seller json,
    items json,
    summary json,
    extraction_metadata json,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.extracted_data OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 33051)
-- Name: extracted_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.extracted_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extracted_data_id_seq OWNER TO postgres;

--
-- TOC entry 4933 (class 0 OID 0)
-- Dependencies: 221
-- Name: extracted_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.extracted_data_id_seq OWNED BY public.extracted_data.id;


--
-- TOC entry 218 (class 1259 OID 33025)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    first_name character varying,
    last_name character varying,
    email_id character varying,
    hashed_password character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 33024)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4934 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4760 (class 2604 OID 33069)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 4758 (class 2604 OID 33039)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4759 (class 2604 OID 33055)
-- Name: extracted_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracted_data ALTER COLUMN id SET DEFAULT nextval('public.extracted_data_id_seq'::regclass);


--
-- TOC entry 4757 (class 2604 OID 33028)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4772 (class 2606 OID 33073)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4766 (class 2606 OID 33045)
-- Name: documents documents_file_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_file_path_key UNIQUE (file_path);


--
-- TOC entry 4768 (class 2606 OID 33043)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4770 (class 2606 OID 33059)
-- Name: extracted_data extracted_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracted_data
    ADD CONSTRAINT extracted_data_pkey PRIMARY KEY (id);


--
-- TOC entry 4764 (class 2606 OID 33032)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4773 (class 1259 OID 33087)
-- Name: ix_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- TOC entry 4774 (class 1259 OID 33086)
-- Name: ix_chat_messages_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_messages_document_id ON public.chat_messages USING btree (document_id);


--
-- TOC entry 4775 (class 1259 OID 33084)
-- Name: ix_chat_messages_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_messages_id ON public.chat_messages USING btree (id);


--
-- TOC entry 4776 (class 1259 OID 33085)
-- Name: ix_chat_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- TOC entry 4761 (class 1259 OID 33033)
-- Name: ix_users_email_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email_id ON public.users USING btree (email_id);


--
-- TOC entry 4762 (class 1259 OID 33034)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 4779 (class 2606 OID 33074)
-- Name: chat_messages chat_messages_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4780 (class 2606 OID 33079)
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4777 (class 2606 OID 33046)
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4778 (class 2606 OID 33060)
-- Name: extracted_data extracted_data_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracted_data
    ADD CONSTRAINT extracted_data_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


-- Completed on 2025-11-02 23:36:42

--
-- PostgreSQL database dump complete
--

-- \unrestrict 5e57UBipdr8XslzUpMc746u2Hh2tnCPRAKNphqUEQY0z1zR2GnhoeN1d0bgThhu

