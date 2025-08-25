SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	0a8b8ce7-3cc3-476e-b820-2296df2119cf	authenticated	authenticated	carlos@ai.rio.br	$2a$06$X5.qlOgFHle6aUz/Ol/azeaZrLkCddFUCJAWyE5E7uFmLUZQhVTuy	2025-08-24 22:03:06.653456+00	\N		\N		\N			\N	2025-08-24 22:03:06.653456+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Carlos Admin"}	t	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00		\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
0a8b8ce7-3cc3-476e-b820-2296df2119cf	0a8b8ce7-3cc3-476e-b820-2296df2119cf	{"sub": "0a8b8ce7-3cc3-476e-b820-2296df2119cf", "email": "carlos@ai.rio.br"}	email	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00	0f391492-5876-403c-9559-e45b1f0a24dc
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: admin_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."admin_alerts" ("id", "type", "title", "message", "severity", "resolved", "resolved_by", "resolved_at", "metadata", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."admin_settings" ("id", "key", "value", "created_by", "updated_by", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: batch_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."batch_jobs" ("id", "user_id", "operation_type", "total_items", "processed_items", "failed_items", "progress_percent", "status", "request_id", "options", "error_details", "execution_time_ms", "memory_usage_mb", "created_at", "updated_at", "completed_at") FROM stdin;
\.


--
-- Data for Name: billing_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."billing_history" ("id", "user_id", "subscription_id", "amount", "currency", "status", "description", "invoice_url", "stripe_invoice_id", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: production_validation_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."production_validation_reports" ("id", "validation_id", "overall_status", "overall_score", "category_scores", "total_tests", "passed_tests", "failed_tests", "warning_tests", "skipped_tests", "critical_issues_count", "deployment_ready", "estimated_risk", "validation_results", "recommendations", "execution_time_ms", "created_at", "metadata") FROM stdin;
95b1730e-0c8e-4447-acad-a35e4d622022	template	pass	95	{}	20	18	0	2	0	0	t	low	[]	[]	0	2025-08-24 22:03:06.92352+00	{}
\.


--
-- Data for Name: business_metrics_validation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."business_metrics_validation" ("id", "validation_id", "metric_name", "metric_category", "baseline_value", "current_value", "target_value", "measurement_unit", "data_source", "validation_method", "created_at") FROM stdin;
\.


--
-- Data for Name: global_optimization_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."global_optimization_reports" ("id", "optimization_id", "overall_performance", "regional_metrics", "optimizations", "recommendations", "configuration_changes", "execution_time_ms", "auto_applied", "created_at") FROM stdin;
\.


--
-- Data for Name: cache_optimization_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cache_optimization_tracking" ("id", "optimization_id", "cache_type", "cache_key_pattern", "ttl_seconds", "compression_enabled", "hit_rate_before", "hit_rate_after", "performance_impact_ms", "memory_usage_mb", "enabled", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."clients" ("id", "user_id", "name", "email", "phone", "address", "notes", "created_at", "updated_at") FROM stdin;
0463d3b8-34f2-4cc0-91ae-423bbeb15629	0a8b8ce7-3cc3-476e-b820-2296df2119cf	Sample Client	client@example.com	+1 (555) 987-6543	123 Main Street, Anytown, ST 12345	Test client for admin user demonstrations	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00
\.


--
-- Data for Name: cold_start_optimization_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cold_start_optimization_tracking" ("id", "optimization_id", "function_name", "optimization_type", "warmup_interval_minutes", "preload_data_items", "cold_start_time_before_ms", "cold_start_time_after_ms", "enabled", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: cold_start_optimizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cold_start_optimizations" ("id", "optimization_id", "function_name", "cold_start_time_before_ms", "cold_start_time_after_ms", "optimization_techniques", "preloaded_modules", "connection_prewarming", "memory_optimization", "execution_context_reuse", "created_at") FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."company_settings" ("id", "company_name", "company_address", "company_email", "company_phone", "logo_url", "logo_file_name", "default_tax_rate", "default_markup_rate", "preferred_currency", "quote_terms", "created_at", "updated_at") FROM stdin;
0a8b8ce7-3cc3-476e-b820-2296df2119cf	Admin Test Company	\N	carlos@ai.rio.br	+1 (555) 123-4567	\N	\N	8.25	15.00	USD	Payment is due within 30 days of quote acceptance. All work is guaranteed for 1 year.	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00
\.


--
-- Data for Name: compliance_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."compliance_tracking" ("id", "framework", "control_id", "control_description", "implementation_status", "compliance_score", "evidence_links", "responsible_team", "last_audit_date", "next_audit_due", "findings", "remediation_plan", "metadata", "created_at", "updated_at") FROM stdin;
2f14090d-cd43-4fa4-bafc-a93e22eb0dbf	SOC2	CC1.1	Entity demonstrates commitment to integrity and ethical values	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
0a31d4b9-5ec0-47f5-a97a-262390754492	SOC2	CC2.1	Entity defines objectives and communicates them	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
19a98734-fa24-4c0f-acb8-1fd6594f6aa4	SOC2	CC3.1	Entity specifies objectives with sufficient clarity	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
c52101b2-6dd0-4c88-80af-fff5c28b59a9	SOC2	CC6.1	Entity implements logical access security software	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
10ad78df-bda3-40aa-949b-50df8bfc900b	SOC2	CC6.2	Entity implements access controls for data and systems	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
3de76999-b34c-4fef-9a04-519864f6c549	GDPR	Art25	Data protection by design and by default	partially_implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
a9a3bfb9-6e41-4ff9-8ab5-f2922fa1d22d	GDPR	Art32	Security of processing	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
bd8d5102-d2df-4fe3-b4ab-a4b9771b02e7	GDPR	Art33	Notification of data breach to supervisory authority	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
589348a8-9641-45b2-9e84-bdb58f14cb4c	GDPR	Art35	Data protection impact assessment	partially_implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
5b788dca-5e7c-4ea5-9a1a-895580c9a8e9	CCPA	Sec1798.100	Right to know about personal information collected	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
146ed823-e98d-49ad-8d86-3885ca570d6b	CCPA	Sec1798.105	Right to delete personal information	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
7c6fd2ce-c7ce-4f11-88eb-f13b78bf9074	CCPA	Sec1798.110	Right to know about personal information sold or disclosed	implemented	\N	[]	\N	\N	\N	[]	[]	{}	2025-08-24 22:03:07.149505+00	2025-08-24 22:03:07.149505+00
\.


--
-- Data for Name: connection_health_monitoring; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_health_monitoring" ("id", "environment", "connection_id", "health_score", "last_health_check", "health_status", "response_time_ms", "error_count", "query_count", "connection_age_ms", "last_used", "health_details", "created_at") FROM stdin;
\.


--
-- Data for Name: connection_pool_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_alerts" ("id", "alert_id", "environment", "alert_type", "severity", "message", "metric_value", "threshold_value", "alert_details", "triggered_at", "resolved_at", "resolved_by", "resolution_notes", "alert_status", "created_at") FROM stdin;
\.


--
-- Data for Name: connection_pool_benchmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_benchmarks" ("id", "benchmark_id", "environment", "test_config", "results", "baseline_metrics", "performance_improvement", "execution_time_ms", "test_type", "test_status", "created_at") FROM stdin;
\.


--
-- Data for Name: connection_pool_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_config" ("id", "environment", "max_connections", "min_connections", "idle_timeout_ms", "connection_timeout_ms", "health_check_interval_ms", "acquire_timeout_ms", "max_retries", "retry_delay_ms", "enable_health_check", "enable_metrics", "config_metadata", "created_at", "updated_at") FROM stdin;
90a8ef70-3b51-4c71-9c49-0a0612f4c116	development	5	1	300000	10000	30000	5000	3	1000	t	t	{}	2025-08-24 22:03:07.269581+00	2025-08-24 22:03:07.269581+00
d7bd3bd1-3343-4018-a65e-7accc1169f43	staging	10	2	300000	15000	60000	8000	3	1000	t	t	{}	2025-08-24 22:03:07.269581+00	2025-08-24 22:03:07.269581+00
1a0c86f4-fc3b-4d88-b71d-5e0095bc0832	production	25	5	600000	30000	60000	10000	3	1000	t	t	{}	2025-08-24 22:03:07.269581+00	2025-08-24 22:03:07.269581+00
\.


--
-- Data for Name: connection_pool_config_changes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_config_changes" ("id", "environment", "change_type", "parameter_name", "old_value", "new_value", "reason", "changed_by", "change_impact", "rollback_info", "applied_at", "created_at") FROM stdin;
\.


--
-- Data for Name: connection_pool_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_metrics" ("id", "environment", "total_connections", "active_connections", "idle_connections", "pending_acquisitions", "pool_utilization", "total_queries", "avg_response_time_ms", "connection_acquisition_time_ms", "error_rate", "successful_queries", "failed_queries", "connection_errors", "timeout_errors", "health_check_score", "memory_usage_mb", "cpu_usage_percent", "created_at") FROM stdin;
\.


--
-- Data for Name: connection_pool_optimization_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_optimization_tracking" ("id", "optimization_id", "region", "pool_type", "max_connections", "idle_timeout_seconds", "connection_timeout_seconds", "health_check_interval_seconds", "connections_before", "connections_after", "avg_wait_time_before_ms", "avg_wait_time_after_ms", "enabled", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: connection_pool_optimizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_optimizations" ("id", "optimization_id", "environment", "current_stats", "usage_analysis", "optimizations", "auto_applied", "performance_impact", "recommendation_score", "implementation_status", "created_at", "implemented_at") FROM stdin;
\.


--
-- Data for Name: connection_pool_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."connection_pool_recommendations" ("id", "recommendation_id", "environment", "category", "priority", "title", "description", "recommended_action", "expected_impact", "implementation_effort", "supporting_data", "implementation_steps", "status", "created_at", "reviewed_at", "implemented_at") FROM stdin;
\.


--
-- Data for Name: cost_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cost_metrics" ("id", "metric_date", "edge_function_invocations", "estimated_monthly_cost", "actual_monthly_cost", "bandwidth_usage_gb", "storage_usage_gb", "database_usage_hours", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: cost_validation_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cost_validation_tracking" ("id", "validation_id", "cost_category", "baseline_cost_monthly", "projected_cost_monthly", "actual_cost_monthly", "usage_metrics", "cost_breakdown", "created_at") FROM stdin;
c8ff9de4-389e-4dd4-a3f1-476c6209f32c	template	edge_functions	0.00	10.00	\N	{}	{}	2025-08-24 22:03:06.92352+00
008fd281-faf4-4b73-a1b6-a267a20a24c7	template	database	25.00	25.00	\N	{}	{}	2025-08-24 22:03:06.92352+00
bf249878-9272-4d4b-a2df-d14332167206	template	storage	5.00	3.00	\N	{}	{}	2025-08-24 22:03:06.92352+00
5c43ed65-1a94-4d4b-a345-b4610ad1ed42	template	bandwidth	15.00	8.00	\N	{}	{}	2025-08-24 22:03:06.92352+00
1a39535d-dd00-4911-ae81-644511f2b09f	template	external_apis	10.00	10.00	\N	{}	{}	2025-08-24 22:03:06.92352+00
0707b9c4-45bf-46d9-8207-e6c1b4d70147	template	monitoring	15.00	8.00	\N	{}	{}	2025-08-24 22:03:06.92352+00
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."customers" ("id", "stripe_customer_id") FROM stdin;
0a8b8ce7-3cc3-476e-b820-2296df2119cf	cus_admin_test_customer
\.


--
-- Data for Name: deployment_readiness_checks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."deployment_readiness_checks" ("id", "validation_id", "check_category", "check_name", "required_for_deployment", "status", "check_result", "automated", "last_checked", "next_check_due", "created_at") FROM stdin;
1f1a42ac-3e98-47ea-936d-e2c2c4ca0e9b	template	code_quality	TypeScript Type Safety	t	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
ea2a4179-87f6-41b1-a80c-bc7d290c6de1	template	test_coverage	Unit Test Coverage >80%	t	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
b458626c-005e-4b9a-b1a4-8b7b5fd1decf	template	documentation	API Documentation Complete	f	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
2f12c310-0009-46bf-866c-f6c4cfd804bb	template	monitoring	Health Check Endpoints	t	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
75549b94-6f6f-41af-be4b-174f5620b76b	template	alerting	Error Rate Alerting	t	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
7630a20e-1d92-46de-a986-c86a4f1008fe	template	backup_recovery	Database Backup Verified	t	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
69978fde-68d9-40b7-87cb-895b2b371e80	template	rollback_procedures	Rollback Plan Tested	t	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
83de14c3-a388-4fba-aa65-83a007909be1	template	compliance	Security Compliance	t	pass	{}	t	2025-08-24 22:03:06.92352+00	\N	2025-08-24 22:03:06.92352+00
\.


--
-- Data for Name: payment_disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."payment_disputes" ("id", "user_id", "charge_id", "amount", "currency", "reason", "status", "evidence_due_by", "closed_at", "last_event_type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: dispute_evidence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."dispute_evidence" ("id", "dispute_id", "user_id", "evidence_data", "submitted_at", "created_at") FROM stdin;
\.


--
-- Data for Name: edge_case_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."edge_case_analytics" ("id", "period_start", "period_end", "total_events", "successful_events", "success_rate", "handler_breakdown", "generated_at") FROM stdin;
\.


--
-- Data for Name: edge_case_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."edge_case_events" ("id", "event_type", "event_id", "user_id", "customer_id", "subscription_id", "invoice_id", "payment_method_id", "handler_used", "success", "actions", "next_steps", "error_message", "context_metadata", "result_metadata", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: edge_function_health; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."edge_function_health" ("id", "function_name", "status", "response_time_ms", "error_rate", "last_checked", "details", "created_at") FROM stdin;
\.


--
-- Data for Name: edge_function_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."edge_function_metrics" ("id", "function_name", "operation_type", "execution_time_ms", "database_queries", "api_calls_made", "memory_usage_mb", "error_count", "user_id", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."feature_flags" ("id", "flag_name", "flag_key", "description", "is_enabled", "target_audience", "conditions", "metadata", "created_by", "created_at", "updated_at") FROM stdin;
9c129229-6505-4ec2-8aa9-ee1cedcb7fff	Edge Functions Migration	edge_functions_migration	Controls the overall Edge Functions migration process	f	{}	{}	{}	\N	2025-08-24 22:03:06.877182+00	2025-08-24 22:03:06.877182+00
aad82128-30ba-40d4-9149-a874422107f0	Subscription Status Migration	subscription_status_migration	Controls migration of subscription status endpoints	f	{}	{}	{}	\N	2025-08-24 22:03:06.877182+00	2025-08-24 22:03:06.877182+00
50bb794f-0288-4fb8-b31e-8c615d9ab8b7	Quote Processor Migration	quote_processor_migration	Controls migration of quote processing endpoints	f	{}	{}	{}	\N	2025-08-24 22:03:06.877182+00	2025-08-24 22:03:06.877182+00
362c0d29-eef1-445a-b7f1-9e9a153f752d	PDF Generator Migration	pdf_generator_migration	Controls migration of PDF generation endpoints	f	{}	{}	{}	\N	2025-08-24 22:03:06.877182+00	2025-08-24 22:03:06.877182+00
32459ac1-e5c4-498a-b972-16d89c8ad731	Webhook Handler Migration	webhook_handler_migration	Controls migration of webhook processing	f	{}	{}	{}	\N	2025-08-24 22:03:06.877182+00	2025-08-24 22:03:06.877182+00
64d46ef6-2f70-45b7-9554-06f5bf2f027e	Batch Processor Migration	batch_processor_migration	Controls migration of batch operations	f	{}	{}	{}	\N	2025-08-24 22:03:06.877182+00	2025-08-24 22:03:06.877182+00
\.


--
-- Data for Name: function_warmup_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."function_warmup_tracking" ("id", "function_name", "warmup_strategy", "warmup_frequency", "last_warmup", "warmup_duration_ms", "warmup_success", "warmup_details", "next_warmup", "enabled", "created_at", "updated_at") FROM stdin;
245bfcd7-09c5-48ab-850c-0c74cb6c5e45	migration-controller	scheduled	300	\N	\N	\N	{}	2025-08-24 22:08:07.325114+00	t	2025-08-24 22:03:07.325114+00	2025-08-24 22:03:07.325114+00
fef4aa94-ce60-4ba1-81ae-29c2f4e9e42c	production-validator	scheduled	600	\N	\N	\N	{}	2025-08-24 22:13:07.325114+00	t	2025-08-24 22:03:07.325114+00	2025-08-24 22:03:07.325114+00
6d03f760-3a22-42e7-9712-8ac4d9b5fdf5	security-hardening	scheduled	600	\N	\N	\N	{}	2025-08-24 22:13:07.325114+00	t	2025-08-24 22:03:07.325114+00	2025-08-24 22:03:07.325114+00
21e0ed30-ef87-47c9-8ef9-81d2709b4564	monitoring-alerting	scheduled	300	\N	\N	\N	{}	2025-08-24 22:08:07.325114+00	t	2025-08-24 22:03:07.325114+00	2025-08-24 22:03:07.325114+00
\.


--
-- Data for Name: global_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."global_categories" ("id", "name", "description", "color", "access_tier", "sort_order", "is_active", "created_at", "updated_at") FROM stdin;
648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	Lawn Care	Basic lawn maintenance and care services	#22c55e	free	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
a665a022-f569-49e0-ae6b-a8b30211ce65	Landscaping	Design, installation, and maintenance of outdoor spaces	#3b82f6	free	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
9613473b-f376-4d13-b716-a14527e1deef	Hardscaping	Patios, walkways, retaining walls, and stone work	#6366f1	premium	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
13906da0-27bc-444b-9052-9bc560127055	Seasonal Services	Spring cleanup, fall cleanup, and seasonal maintenance	#f59e0b	free	6	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	Fertilization	Soil treatment and plant nutrition	#84cc16	free	8	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
3a8f1887-9104-4e67-bc81-f6098b33b8f9	Specialty Services	Unique and specialized landscaping services	#8b5cf6	premium	10	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
e08fef36-357c-4a74-8786-e60b85681c01	Tree Services	Tree care, pruning, and removal services	#059669	premium	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
cfdc4a45-83d1-43c1-8612-a9950fe0449a	Irrigation	Sprinkler systems and watering solutions	#0ea5e9	premium	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
18dbf000-bc4d-4a18-bf0b-ac7dcb209040	Pest Control	Lawn and garden pest management	#ef4444	premium	7	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
0cbea0b0-943a-4767-9403-f2d6f3936c1b	Snow Services	Snow removal and winter maintenance	#64748b	premium	9	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
\.


--
-- Data for Name: global_deployment_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."global_deployment_status" ("id", "deployment_version", "region", "function_name", "deployment_status", "deployment_time", "health_check_passed", "performance_validated", "rollback_available", "error_message", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: global_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."global_items" ("id", "name", "category_id", "subcategory", "unit", "cost", "description", "notes", "access_tier", "tags", "sort_order", "is_active", "created_at", "updated_at") FROM stdin;
3be3c1f0-5447-41de-80cc-815e066fe6f8	Lawn Mowing	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per visit	45.00	Standard lawn mowing service including grass cutting and basic cleanup	\N	free	{mowing,maintenance,weekly}	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
6d9af50b-0ab0-4c0b-a5a5-ddfb89ee403b	Edging	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per visit	25.00	Precise edging along walkways, driveways, and garden beds	\N	free	{edging,trimming,cleanup}	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
441db942-d2c2-4ef2-a941-c95099678b3b	String Trimming	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per visit	20.00	Detailed trimming around obstacles and tight spaces	\N	free	{trimming,"weed eating","detail work"}	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
879aa6ab-9531-4d3d-8afc-1f93e3ce3e96	Leaf Blowing	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per visit	30.00	Clearing leaves and debris from lawn and hardscapes	\N	free	{cleanup,blowing,maintenance}	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
5ff6b326-a118-460d-944c-8c495a5d7053	Basic Weeding	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per hour	35.00	Manual removal of weeds from garden beds and lawn areas	\N	free	{weeding,"hand pulling",maintenance}	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
154b4321-c8d3-4f47-96ae-8b568a9d2a3b	Hedge Trimming	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per hour	65.00	Professional hedge trimming and shaping services	\N	free	{trimming,pruning,shaping}	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
9ac44f63-0bc6-459c-ac2d-5228ebcb77fe	Mulch Installation	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per cubic yard	85.00	Installation of organic or decorative mulch in garden beds	\N	free	{mulch,installation,beds}	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
7357bd39-10cf-464a-94e1-7f05333e8feb	Flower Bed Maintenance	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per hour	55.00	Weeding, deadheading, and general flower bed care	\N	free	{flowers,beds,maintenance}	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
955d8a99-92da-40e5-8f00-4ee28922b642	Shrub Pruning	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per shrub	25.00	Selective pruning of shrubs for health and appearance	\N	free	{pruning,shrubs,trimming}	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
b63be103-10d4-4f88-9812-cd26b1042363	Basic Planting	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per plant	15.00	Planting of small plants, flowers, and shrubs	\N	free	{planting,installation,flowers}	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
5135cc9f-4964-401b-b279-64225f6537d5	Patio Installation	9613473b-f376-4d13-b716-a14527e1deef	\N	per sq ft	12.00	Professional patio installation with pavers or stone	\N	premium	{patio,hardscape,installation}	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
32b72ae5-950c-400d-89f1-d9a5f3111653	Retaining Wall	9613473b-f376-4d13-b716-a14527e1deef	\N	per linear foot	35.00	Construction of decorative and functional retaining walls	\N	premium	{"retaining wall",structural,stone}	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
6962a675-bf6b-4831-a1f0-b56addcae0b6	Walkway Installation	9613473b-f376-4d13-b716-a14527e1deef	\N	per linear foot	18.00	Installation of decorative walkways and pathways	\N	premium	{walkway,path,pavers}	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
106bea61-0c2d-4f8e-b51e-6d80b5c982e1	Fire Pit Installation	9613473b-f376-4d13-b716-a14527e1deef	\N	per installation	800.00	Custom fire pit design and installation	\N	premium	{"fire pit","outdoor living",stone}	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
ba56ab0d-eceb-45b2-b83d-46d952d10e13	Outdoor Kitchen	9613473b-f376-4d13-b716-a14527e1deef	\N	per sq ft	45.00	Complete outdoor kitchen design and construction	\N	premium	{"outdoor kitchen",cooking,entertainment}	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
539c9b8b-6336-4f05-82f6-76f79169377e	Spring Cleanup	13906da0-27bc-444b-9052-9bc560127055	\N	per visit	120.00	Comprehensive spring property cleanup and preparation	\N	free	{spring,cleanup,seasonal}	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
c1caebdb-b3e4-41ab-9ee5-35802792dd69	Fall Cleanup	13906da0-27bc-444b-9052-9bc560127055	\N	per visit	150.00	Fall leaf removal and winter preparation services	\N	free	{fall,leaves,cleanup}	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
47978f42-e697-4dd3-9806-c75461e35d9e	Leaf Removal	13906da0-27bc-444b-9052-9bc560127055	\N	per bag	8.00	Collection and removal of fallen leaves	\N	free	{leaves,removal,bagging}	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
0148551a-fdb1-475a-a55b-c020aaa6e17d	Gutter Cleaning	13906da0-27bc-444b-9052-9bc560127055	\N	per linear foot	3.50	Professional gutter cleaning and debris removal	\N	free	{gutters,cleaning,maintenance}	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
e93bf207-51ac-455c-9125-0e0ba67b207a	Holiday Lighting	13906da0-27bc-444b-9052-9bc560127055	\N	per linear foot	5.00	Installation and removal of holiday lighting displays	\N	free	{holiday,lighting,decoration}	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
166ef9d1-07d6-4bc6-be39-6ce5d101f4cf	Organic Fertilization	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per application	75.00	Organic and environmentally friendly fertilization	\N	free	{organic,fertilizer,eco-friendly}	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
99740fbd-8c79-4ae7-b00c-ef159513d4c4	Tree Pruning	e08fef36-357c-4a74-8786-e60b85681c01	\N	per hour	85.00	Professional tree pruning for health, safety, and aesthetics	\N	premium	{pruning,"tree care",safety}	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
3637b6e4-ad1f-402f-b44c-121bfd35abde	Soil Testing	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per test	45.00	Professional soil analysis and pH testing	\N	free	{soil,testing,analysis}	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
03378fbc-2156-4b8f-b5ee-dcc75f6ae835	Lime Application	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per application	65.00	Lime application for soil pH adjustment	\N	free	{lime,pH,"soil treatment"}	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
0cb0d3c7-af72-4918-bc63-83d5ca3e0807	Compost Application	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per cubic yard	45.00	Application of quality compost for soil enhancement	\N	free	{compost,organic,"soil improvement"}	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.698643+00
bb92136d-378b-4493-9816-d0a8de31bf3f	Lawn Fertilization	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per application	70.00	Professional lawn fertilization with quality nutrients	\N	free	{fertilizer,lawn,nutrition}	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.753498+00
f4f4328d-22bb-4bdc-9f8a-dba7662fd5f9	Premium Topsoil	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per cubic yard	45.00	High-quality topsoil for lawn establishment and repair	\N	free	{soil,topsoil,material}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
67269919-9f3b-4208-9070-db413f6074f4	Grass Seed - Cool Season	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per 50lb bag	180.00	Premium cool-season grass seed blend for northern climates	\N	free	{seed,grass,"cool season"}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
a4b5f2d8-b44a-48a4-9e1a-5569ab936737	Grass Seed - Warm Season	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per 50lb bag	220.00	Premium warm-season grass seed blend for southern climates	\N	free	{seed,grass,"warm season"}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
17b73206-e793-4ad3-9c2d-f819a01ec7c1	Lawn Repair Kit	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per kit	25.00	Complete lawn repair kit with seed, fertilizer, and mulch	\N	free	{repair,patch,seed}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
b33469f6-5b83-4835-bc0c-d880b823d1d9	Organic Mulch	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per cubic yard	65.00	Natural organic mulch for garden beds and landscaping	\N	free	{mulch,organic,material}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
e01c1f56-9bd9-46cb-85b8-8e9d321b568c	Decorative Rock Mulch	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per cubic yard	85.00	Decorative rock mulch for low-maintenance landscaping	\N	free	{mulch,rock,decorative}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
a7deb90d-eca4-4ca8-b2b1-08cda98d0484	Annual Flowers	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per flat (18 plants)	32.00	Seasonal annual flowers for color and garden displays	\N	free	{flowers,annuals,plants}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
35c5ddab-1753-4956-af5d-371257c9a102	Perennial Plants	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per plant	18.00	Hardy perennial plants for lasting garden beauty	\N	free	{perennials,plants,flowers}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
d0cc8a74-9086-48e4-800c-cf1f0cf2b317	Small Shrubs	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per plant	35.00	Small to medium ornamental shrubs for landscaping	\N	free	{shrubs,plants,landscape}	10	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
46d071f3-1d9b-497a-ae59-32c7f3882074	Landscape Fabric	a665a022-f569-49e0-ae6b-a8b30211ce65	\N	per square foot	0.75	Professional-grade landscape fabric for weed control	\N	free	{fabric,"weed barrier",material}	11	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
bfec791d-9770-40df-b94b-88dafab44592	Concrete Pavers	9613473b-f376-4d13-b716-a14527e1deef	\N	per square foot	2.50	Durable concrete pavers for patios and walkways	\N	premium	{pavers,concrete,material}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
8cd12a30-fbff-4475-b417-3517bc816ea2	Natural Stone Pavers	9613473b-f376-4d13-b716-a14527e1deef	\N	per square foot	8.50	Premium natural stone pavers for luxury hardscaping	\N	premium	{pavers,stone,natural}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
e68dfbb0-9285-4137-9a35-4fb19169e325	Brick Pavers	9613473b-f376-4d13-b716-a14527e1deef	\N	per square foot	6.00	Traditional clay brick pavers for timeless appeal	\N	premium	{pavers,brick,classic}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
5e0575d0-ee87-4dc1-9502-f788500c32c6	Paver Base Material	9613473b-f376-4d13-b716-a14527e1deef	\N	per cubic yard	28.00	Crushed stone base material for paver installations	\N	premium	{base,foundation,material}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
b03c808e-366b-4143-9bbe-6b3049a9a797	Paver Sand	9613473b-f376-4d13-b716-a14527e1deef	\N	per cubic yard	35.00	Fine sand for paver leveling and joint filling	\N	premium	{sand,leveling,material}	10	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
a91bbc59-7986-4f9f-b45f-2d297cdbb28c	Retaining Wall Blocks	9613473b-f376-4d13-b716-a14527e1deef	\N	per square foot	8.50	Interlocking blocks for retaining wall construction	\N	premium	{blocks,retaining,structural}	11	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
d723a340-f965-4300-8970-06ff29aa0480	Flagstone	9613473b-f376-4d13-b716-a14527e1deef	\N	per square foot	12.00	Natural flagstone for premium walkways and patios	\N	premium	{flagstone,natural,premium}	12	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
96d735f2-bb7c-4000-be5b-01f522a0fb03	Decorative Gravel	9613473b-f376-4d13-b716-a14527e1deef	\N	per cubic yard	45.00	Decorative gravel for drainage and landscape accents	\N	premium	{gravel,decorative,drainage}	13	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
06169c0a-10e9-46b0-84e8-8facc4ca449b	Premium Fertilizer	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per 50lb bag	52.00	High-quality lawn fertilizer for optimal grass nutrition	\N	free	{fertilizer,premium,material}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
e79aa28d-7f6f-4378-b360-c5a274f07d07	Organic Fertilizer	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per 50lb bag	68.00	Organic fertilizer for environmentally conscious lawn care	\N	free	{fertilizer,organic,eco-friendly}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
cf257e6d-1c58-4835-bac5-273930138898	Lime	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per 50lb bag	12.00	Agricultural lime for soil pH adjustment	\N	free	{lime,pH,"soil treatment"}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
b9b6d68f-320f-4a35-8f0e-32ea38a9d861	Compost	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per cubic yard	35.00	Premium compost for soil improvement and plant health	\N	free	{compost,organic,"soil amendment"}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
549b458a-8ac7-471d-8e4e-dc332c213b61	Soil Amendment	1fe18a97-eb07-4b26-a05b-9fcf2d5559ce	\N	per cubic yard	42.00	Professional soil amendment for enhanced growing conditions	\N	free	{amendment,soil,improvement}	10	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
97d26f9e-d119-4763-a590-f8528deccbb5	Outdoor Kitchen Design	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per consultation	500.00	Professional outdoor kitchen design consultation	\N	premium	{design,consultation,kitchen}	1	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
5521468b-8d51-4a2c-81d1-5d5afeb3c963	Water Feature Installation	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per installation	2500.00	Custom water feature and fountain installation	\N	premium	{"water feature",fountain,pond}	2	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
0797b924-9a6e-42fc-a476-246c2bff7b91	Outdoor Lighting System	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per fixture	125.00	Professional landscape lighting installation	\N	premium	{lighting,outdoor,landscape}	3	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
2ae1979e-b456-4b97-b5a9-82ae7afdc9b3	Pergola Installation	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per square foot	35.00	Custom pergola design and installation	\N	premium	{pergola,structure,shade}	4	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
76c25910-e068-483a-b332-d502bee1f512	Garden Bed Design	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per design	350.00	Professional garden bed design and planning	\N	premium	{design,garden,beds}	5	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
e0605521-d184-4236-9938-c1627f88070c	Xeriscape Installation	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per square foot	8.50	Drought-tolerant landscaping installation	\N	premium	{xeriscape,"drought tolerant",sustainable}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
b6429c51-0ced-475d-8931-8da89c839659	Living Wall Installation	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per square foot	85.00	Vertical garden and living wall installation	\N	premium	{"living wall","vertical garden",innovative}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
103b4ffe-4dea-411a-b4bd-2e2bf5d2ebb3	Outdoor Audio System	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per zone	650.00	Weather-resistant outdoor audio system installation	\N	premium	{audio,sound,entertainment}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
6e01f4f3-6d95-4bd8-84e0-bf584deb7d9d	Outdoor Lighting Fixtures	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	each	85.00	Professional-grade outdoor lighting fixtures	\N	premium	{fixtures,lighting,material}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
4cabd2eb-c758-4885-9ce1-807c1739ccb2	Low-Voltage Wire	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per linear foot	1.25	Low-voltage wire for outdoor lighting systems	\N	premium	{wire,"low voltage",lighting}	10	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
5430d105-cb6b-49d7-8803-cba03e9231ab	Water Feature Pumps	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	each	185.00	Submersible pumps for water features and fountains	\N	premium	{pump,"water feature",fountain}	11	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
a776bb0e-c54e-4415-9c93-58e64c53de1d	Drought-Tolerant Plants	3a8f1887-9104-4e67-bc81-f6098b33b8f9	\N	per plant	22.00	Specialized drought-tolerant plants for xeriscaping	\N	premium	{plants,"drought tolerant",xeriscape}	12	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
4977170e-ca94-4727-8d99-14acea14756f	Lawn Mower Rental	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per day	45.00	Commercial lawn mower rental for large properties	\N	free	{equipment,rental,mower}	10	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
20a25c50-fe5b-472d-91ed-376d6b02e419	Aerator Rental	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per day	55.00	Core aerator rental for lawn improvement	\N	free	{equipment,rental,aerator}	11	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
38b44388-b648-44ad-9d64-5cfa01cb911e	Overseeder Rental	648dbf3c-2ae7-4dea-bfb1-c7b8f36cddcc	\N	per day	65.00	Overseeder rental for lawn renovation	\N	free	{equipment,rental,seeding}	12	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
4031e01b-28dc-45cc-ac86-22724841b99a	Mini Excavator Rental	9613473b-f376-4d13-b716-a14527e1deef	\N	per day	320.00	Mini excavator rental for hardscaping projects	\N	premium	{equipment,rental,excavator}	14	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
9bd0046a-df3e-4b0c-96b8-cca6d11be457	Plate Compactor Rental	9613473b-f376-4d13-b716-a14527e1deef	\N	per day	75.00	Plate compactor rental for base preparation	\N	premium	{equipment,rental,compactor}	15	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
e132b810-a7cd-4c6d-9b86-4e01bf1ef0d2	Wet Saw Rental	9613473b-f376-4d13-b716-a14527e1deef	\N	per day	95.00	Wet tile/stone saw rental for precise cutting	\N	premium	{equipment,rental,saw}	16	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.753498+00
8cb181e9-0265-472c-b1a0-d31989ac3732	Tree Removal	e08fef36-357c-4a74-8786-e60b85681c01	\N	per tree	500.00	Complete tree removal including stump grinding	\N	premium	{removal,cutting,cleanup}	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
9d99759f-aafa-4e58-b470-ebb153a13c24	Stump Grinding	e08fef36-357c-4a74-8786-e60b85681c01	\N	per stump	150.00	Professional stump grinding and cleanup	\N	premium	{stump,grinding,removal}	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
cbecb670-75a6-4b85-9277-8056287272a8	Tree Health Assessment	e08fef36-357c-4a74-8786-e60b85681c01	\N	per assessment	125.00	Professional evaluation of tree health and recommendations	\N	premium	{assessment,health,diagnosis}	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
f6567511-729b-4120-9502-37dc4fb637fa	Emergency Tree Service	e08fef36-357c-4a74-8786-e60b85681c01	\N	per hour	150.00	24/7 emergency tree removal and storm damage cleanup	\N	premium	{emergency,"storm damage",urgent}	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
dbe280ff-9960-4670-bed4-d9283c11b1d8	Sprinkler Installation	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per zone	150.00	Installation of automatic sprinkler system zones	\N	premium	{irrigation,installation,sprinklers}	1	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
93de42cd-a8d3-452f-a360-aafab5ed3a64	Drip Irrigation Setup	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per linear foot	8.00	Water-efficient drip irrigation system installation	\N	premium	{drip,irrigation,"water saving"}	2	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
4c8da53f-d582-4857-9e06-5f781ad673ed	Irrigation Repair	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per hour	75.00	Diagnosis and repair of irrigation system issues	\N	premium	{repair,maintenance,troubleshooting}	3	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
8e681647-368e-4b98-967c-a9ecc44244ea	Sprinkler Winterization	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per system	85.00	Seasonal winterization and system blowout service	\N	premium	{winterization,blowout,seasonal}	4	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
87bb6999-bd97-4d5d-b183-852a3c5ce4fe	Smart Controller Installation	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per controller	200.00	Installation and setup of smart irrigation controllers	\N	premium	{smart,controller,automation}	5	t	2025-08-24 22:03:06.698643+00	2025-08-24 22:03:06.768+00
dd5fdaa1-ba4d-4ab5-8f31-dc49e2eecf82	Tree Stakes & Ties	e08fef36-357c-4a74-8786-e60b85681c01	\N	per set	15.00	Professional tree staking system for newly planted trees	\N	premium	{stakes,support,installation}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
68986107-bd34-4e8e-9d30-f33bc8054851	Tree Fertilizer Spikes	e08fef36-357c-4a74-8786-e60b85681c01	\N	per package	22.00	Slow-release fertilizer spikes for mature trees	\N	premium	{fertilizer,spikes,nutrition}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
8dd542ee-46ab-4414-9eaa-ae9b4d0ca4cd	Wound Dressing	e08fef36-357c-4a74-8786-e60b85681c01	\N	per container	18.00	Professional wound dressing for tree pruning cuts	\N	premium	{wound,treatment,pruning}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
c03101f2-7d6f-4cdb-82a8-64e5db49d5b6	Rotary Sprinkler Heads	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	each	12.00	Professional rotary sprinkler heads for large coverage areas	\N	premium	{sprinkler,heads,rotary}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
889241cb-6af8-4988-b916-ec09252b7a14	Spray Sprinkler Heads	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	each	8.00	Fixed spray sprinkler heads for precise watering	\N	premium	{sprinkler,heads,spray}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
e5d276a5-6088-48a0-94b3-e5b1daa04367	PVC Pipe (4 inch)	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per linear foot	3.50	4-inch PVC pipe for irrigation main lines	\N	premium	{pipe,PVC,irrigation}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
e12e450e-62fb-4754-b02a-e266ec646789	PVC Fittings	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per piece	2.25	Various PVC fittings and connectors for irrigation systems	\N	premium	{fittings,PVC,connectors}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
383d576e-5f57-4a88-8f31-6038139c6107	Irrigation Wire	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per linear foot	0.35	Irrigation control wire for valve and controller connections	\N	premium	{wire,electrical,control}	10	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
4e5ad967-3ca0-4377-b93d-0c81988337c7	Irrigation Valves	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	each	45.00	Professional irrigation zone control valves	\N	premium	{valves,control,zone}	11	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
46c5a960-e9f8-4c56-ae4d-83fefa131529	Drip Tubing	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per linear foot	0.85	Drip irrigation tubing for water-efficient watering	\N	premium	{drip,tubing,efficient}	12	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
f3143622-8d42-4fcd-9e5b-9c2b969f9ceb	Drip Emitters	cfdc4a45-83d1-43c1-8612-a9950fe0449a	\N	per 25 pack	18.00	Adjustable drip emitters for precise plant watering	\N	premium	{emitters,drip,precise}	13	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
affd99dd-f5f9-47f5-b540-8865651df01e	Lawn Insect Control	18dbf000-bc4d-4a18-bf0b-ac7dcb209040	\N	per application	85.00	Professional insect control treatment for lawn areas	\N	premium	{insect,control,treatment}	1	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
64b7a757-ee9d-4ab1-8a74-30465323e16c	Grub Control Treatment	18dbf000-bc4d-4a18-bf0b-ac7dcb209040	\N	per application	95.00	Specialized grub control and prevention treatment	\N	premium	{grub,control,preventive}	2	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
b2ee07b3-35da-4465-8792-9af3fb10517c	Weed Control Application	18dbf000-bc4d-4a18-bf0b-ac7dcb209040	\N	per application	125.00	Professional weed control and herbicide application	\N	premium	{weed,herbicide,control}	3	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
b26f3a44-6b61-4c51-b488-1ff3d885818e	Disease Control Treatment	18dbf000-bc4d-4a18-bf0b-ac7dcb209040	\N	per application	110.00	Fungicide treatment for lawn and plant disease control	\N	premium	{disease,fungicide,treatment}	4	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
0fcab5b8-632c-4c25-8685-2bc761ce0c84	Integrated Pest Management	18dbf000-bc4d-4a18-bf0b-ac7dcb209040	\N	per consultation	150.00	Comprehensive integrated pest management consultation	\N	premium	{IPM,consultation,comprehensive}	5	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
59f84262-ed3a-417f-8411-e80f15cecff5	Organic Pest Control	18dbf000-bc4d-4a18-bf0b-ac7dcb209040	\N	per application	135.00	Environmentally friendly organic pest control treatment	\N	premium	{organic,eco-friendly,"pest control"}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
eb5aeca1-c61a-4ba3-b9bb-d07de3f8c4db	Snow Plowing	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per visit	75.00	Professional snow plowing for driveways and parking areas	\N	premium	{plowing,"snow removal",driveway}	1	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
eefd5612-6c1f-4321-8ee9-e03848b2c338	Sidewalk Snow Removal	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per linear foot	2.50	Hand removal of snow from sidewalks and walkways	\N	premium	{sidewalk,shoveling,walkway}	2	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
3b9f449e-465d-4ee5-8cd2-26a7767bb884	Ice Management	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per application	45.00	Ice control and de-icing service for safety	\N	premium	{ice,salt,de-icing}	3	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
35518a3b-8060-4ece-8613-f3cb83dd4701	Snow Hauling	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per hour	120.00	Snow hauling and removal for heavy accumulations	\N	premium	{hauling,removal,"heavy snow"}	4	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
a84a9ca8-d386-4f97-88bc-67be0afbd455	Emergency Snow Service	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per hour	150.00	24/7 emergency snow removal service	\N	premium	{emergency,24/7,urgent}	5	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
23198d04-4d60-408a-9215-2837a0e327df	Seasonal Snow Contract	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per season	1200.00	Seasonal unlimited snow removal contract	\N	premium	{seasonal,contract,unlimited}	6	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
1a524295-239b-4900-bf87-393eb281c5cd	Rock Salt	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per 50lb bag	8.50	Rock salt for ice melting and traction	\N	premium	{salt,"ice melt",material}	7	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
6ca67fad-f7a3-42e9-9a4a-cc8d5de3401a	Premium Ice Melt	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per 50lb bag	18.00	Premium ice melt safe for plants and concrete	\N	premium	{"ice melt",premium,safe}	8	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
2b6a2f6c-3190-466d-a534-4642f0203d2d	Sand	0cbea0b0-943a-4767-9403-f2d6f3936c1b	\N	per cubic yard	25.00	Sand for traction on icy surfaces	\N	premium	{sand,traction,safety}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
8269e363-09fa-4321-a387-d4235ee059bd	Chainsaw Rental	e08fef36-357c-4a74-8786-e60b85681c01	\N	per day	65.00	Professional chainsaw rental for tree work	\N	premium	{equipment,rental,chainsaw}	9	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
ca657c74-9647-4514-b966-4790d2e23940	Stump Grinder Rental	e08fef36-357c-4a74-8786-e60b85681c01	\N	per day	285.00	Self-propelled stump grinder rental	\N	premium	{equipment,rental,grinder}	10	t	2025-08-24 22:03:06.753498+00	2025-08-24 22:03:06.768+00
\.


--
-- Data for Name: global_optimization_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."global_optimization_config" ("id", "config_type", "config_key", "config_value", "enabled", "applied_at", "last_modified_at", "metadata") FROM stdin;
269a4350-458c-4d2d-ad9f-7e3b5d0b97e5	caching	global_cache_strategy	{"ttl": 3600, "cacheKeys": ["user_settings", "product_catalog", "pricing_data"], "compressionEnabled": true}	t	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00	{}
31654bda-e263-4eff-a454-9634c617daed	cold_start	function_warming	{"enabled": true, "warmupInterval": 15, "warmupFunctions": ["subscription-status", "webhook-handler", "quote-processor"]}	t	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00	{}
ce44747a-5f2b-4a37-9dd8-6e95acfeb3d2	connection_pooling	database_pool	{"enabled": true, "poolSize": 20, "maxIdleTime": 300, "healthCheckInterval": 60}	t	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00	{}
bbbfea25-c746-4eeb-b346-dc52f0b56d6a	load_balancing	strategy	{"timeout": 5000, "strategy": "weighted", "failoverEnabled": true, "healthCheckEnabled": true}	t	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00	{}
55113ed4-bba0-4d54-84d7-3833fcad3b68	global_settings	performance_targets	{"uptime": 99.9, "errorRate": 0.1, "throughput": 100, "responseTime": 500}	t	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00	{}
\.


--
-- Data for Name: item_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."item_categories" ("id", "user_id", "name", "color", "description", "sort_order", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: line_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."line_items" ("id", "user_id", "name", "unit", "cost", "category", "tags", "is_favorite", "last_used_at", "created_at", "updated_at") FROM stdin;
5658c996-3a7b-4034-92d0-e8f66293a7bf	0a8b8ce7-3cc3-476e-b820-2296df2119cf	Lawn Mowing Service	per visit	45.00	Maintenance	{lawn,mowing,maintenance}	t	\N	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00
ab386221-79f1-4ff2-9913-7ae8a98bc173	0a8b8ce7-3cc3-476e-b820-2296df2119cf	Hedge Trimming	per hour	65.00	Landscaping	{hedge,trimming,pruning}	t	\N	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00
e8c85982-b15a-4cc1-a361-582cdb432cb5	0a8b8ce7-3cc3-476e-b820-2296df2119cf	Mulch Installation	per cubic yard	85.00	Installation	{mulch,installation,landscaping}	f	\N	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00
8d6d94fd-bbf4-4c20-ac19-5358ba0e844e	0a8b8ce7-3cc3-476e-b820-2296df2119cf	Fertilizer Application	per application	55.00	Treatment	{fertilizer,treatment,"lawn care"}	t	\N	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00
\.


--
-- Data for Name: load_balancing_optimization_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."load_balancing_optimization_tracking" ("id", "optimization_id", "strategy", "regional_weights", "health_check_enabled", "failover_enabled", "timeout_ms", "traffic_distribution_before", "traffic_distribution_after", "performance_variance_before", "performance_variance_after", "enabled", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: load_testing_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."load_testing_results" ("id", "validation_id", "function_name", "test_scenario", "concurrent_users", "test_duration_seconds", "total_requests", "successful_requests", "failed_requests", "avg_response_time_ms", "min_response_time_ms", "max_response_time_ms", "p95_response_time_ms", "p99_response_time_ms", "requests_per_second", "error_rate", "cpu_usage_percent", "memory_usage_mb", "database_connections", "test_status", "performance_degradation", "bottlenecks_identified", "created_at") FROM stdin;
\.


--
-- Data for Name: memory_optimizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."memory_optimizations" ("id", "optimization_id", "function_name", "memory_before_mb", "memory_after_mb", "optimization_techniques", "garbage_collection_performed", "cache_cleared", "module_unloading", "memory_efficiency_score", "peak_memory_usage_mb", "average_memory_usage_mb", "created_at") FROM stdin;
\.


--
-- Data for Name: migration_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."migration_config" ("id", "current_state", "target_traffic_percent", "actual_traffic_percent", "health_check_interval", "rollback_thresholds", "enabled_functions", "feature_flags", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: migration_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."migration_metrics" ("id", "migration_id", "current_phase", "start_time", "end_time", "progress_percent", "health_score", "traffic_split_percent", "performance_improvement", "error_rate", "rollbacks_triggered", "active_alerts", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: migration_performance_benchmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."migration_performance_benchmarks" ("id", "migration_id", "function_name", "metric_type", "baseline_value", "current_value", "target_value", "measurement_unit", "sample_size", "last_measured_at", "created_at") FROM stdin;
\.


--
-- Data for Name: migration_rollbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."migration_rollbacks" ("id", "migration_id", "rollback_reason", "rolled_back_from", "rollback_time", "traffic_at_rollback", "recovery_time_ms", "automatic", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: onboarding_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."onboarding_analytics" ("id", "user_id", "tour_id", "step_id", "event_type", "event_data", "session_id", "user_agent", "device_type", "created_at") FROM stdin;
\.


--
-- Data for Name: onboarding_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."onboarding_progress" ("id", "user_id", "has_seen_welcome", "completed_tours", "skipped_tours", "active_tour_id", "active_tour_step", "tour_progresses", "session_count", "last_active_at", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: payment_method_failures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."payment_method_failures" ("id", "payment_method_id", "user_id", "failure_type", "failure_code", "failure_message", "retryable", "occurred_at", "resolved_at", "resolution_method", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."payment_methods" ("id", "user_id", "stripe_payment_method_id", "type", "card_brand", "card_last4", "card_exp_month", "card_exp_year", "is_default", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: pdf_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pdf_templates" ("id", "name", "description", "html_template", "css_styles", "is_default", "user_id", "company_id", "created_at", "updated_at") FROM stdin;
default	Default Quote Template	Standard quote template with company branding support	<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="utf-8">\n    <title>Quote {{quote_number}}</title>\n</head>\n<body>\n    <div class="quote-container">\n        <header class="quote-header">\n            <h1>Quote {{quote_number}}</h1>\n            <div class="quote-info">\n                <p><strong>Date:</strong> {{quote_date}}</p>\n                <p><strong>Valid Until:</strong> {{valid_until}}</p>\n                <p><strong>Status:</strong> {{status}}</p>\n            </div>\n        </header>\n\n        <section class="client-info">\n            <h2>Client Information</h2>\n            <p><strong>Name:</strong> {{client_name}}</p>\n            <p><strong>Email:</strong> {{client_email}}</p>\n            <p><strong>Phone:</strong> {{client_phone}}</p>\n            <p><strong>Address:</strong> {{client_address}}</p>\n        </section>\n\n        <section class="line-items">\n            <h2>Services & Materials</h2>\n            <table class="items-table">\n                <thead>\n                    <tr>\n                        <th>Item</th>\n                        <th>Description</th>\n                        <th>Qty</th>\n                        <th>Unit Price</th>\n                        <th>Total</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    {{line_items}}\n                </tbody>\n            </table>\n        </section>\n\n        <section class="quote-totals">\n            <table class="totals-table">\n                <tr>\n                    <td><strong>Subtotal:</strong></td>\n                    <td>{{subtotal}}</td>\n                </tr>\n                <tr>\n                    <td><strong>Tax ({{tax_rate}}):</strong></td>\n                    <td>{{tax_amount}}</td>\n                </tr>\n                <tr class="total-row">\n                    <td><strong>Total:</strong></td>\n                    <td><strong>{{total}}</strong></td>\n                </tr>\n            </table>\n        </section>\n\n        <section class="notes">\n            <h2>Notes</h2>\n            <p>{{notes}}</p>\n        </section>\n    </div>\n</body>\n</html>	body {\n        font-family: Arial, sans-serif;\n        margin: 0;\n        padding: 20px;\n        color: #333;\n        line-height: 1.6;\n    }\n    \n    .quote-container {\n        max-width: 800px;\n        margin: 0 auto;\n    }\n    \n    .quote-header {\n        border-bottom: 2px solid #007bff;\n        padding-bottom: 20px;\n        margin-bottom: 30px;\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n    }\n    \n    .quote-header h1 {\n        color: #007bff;\n        margin: 0;\n    }\n    \n    .quote-info p {\n        margin: 5px 0;\n    }\n    \n    .client-info, .line-items, .notes {\n        margin-bottom: 30px;\n    }\n    \n    .client-info h2, .line-items h2, .notes h2 {\n        color: #007bff;\n        border-bottom: 1px solid #ddd;\n        padding-bottom: 10px;\n    }\n    \n    .items-table {\n        width: 100%;\n        border-collapse: collapse;\n        margin-bottom: 20px;\n    }\n    \n    .items-table th, .items-table td {\n        border: 1px solid #ddd;\n        padding: 12px;\n        text-align: left;\n    }\n    \n    .items-table th {\n        background-color: #f8f9fa;\n        font-weight: bold;\n    }\n    \n    .quote-totals {\n        float: right;\n        width: 300px;\n    }\n    \n    .totals-table {\n        width: 100%;\n        border-collapse: collapse;\n    }\n    \n    .totals-table td {\n        padding: 8px;\n        border-bottom: 1px solid #ddd;\n    }\n    \n    .total-row {\n        border-top: 2px solid #007bff;\n        font-size: 1.2em;\n    }\n    \n    .total-row td {\n        border-bottom: 2px solid #007bff;\n        padding: 12px 8px;\n    }\n    \n    @media print {\n        body {\n            margin: 0;\n            padding: 15px;\n        }\n        \n        .quote-container {\n            max-width: none;\n        }\n    }	t	\N	\N	2025-08-24 22:03:06.817136+00	2025-08-24 22:03:06.817136+00
\.


--
-- Data for Name: pdf_generation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pdf_generation_logs" ("id", "user_id", "quote_id", "template_id", "generation_type", "status", "file_size_kb", "generation_time_ms", "storage_path", "error_message", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: performance_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_alerts" ("id", "alert_id", "function_name", "alert_type", "severity", "metric_name", "threshold_value", "actual_value", "message", "alert_details", "triggered_at", "resolved_at", "resolved_by", "alert_status", "auto_resolved", "created_at") FROM stdin;
\.


--
-- Data for Name: performance_baselines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_baselines" ("id", "operation_name", "baseline_response_time_ms", "baseline_api_calls", "baseline_db_queries", "target_response_time_ms", "target_api_calls", "target_db_queries", "created_at", "updated_at") FROM stdin;
1458c848-ae11-44a8-a2cc-716e6b0080a2	subscription_status	800	5	10	400	1	4	2025-08-24 22:03:06.797711+00	2025-08-24 22:03:06.797711+00
a9e083a6-4f6b-4b44-89d3-2a4aa930d710	quote_generation	2500	8	15	1200	2	8	2025-08-24 22:03:06.797711+00	2025-08-24 22:03:06.797711+00
d26f8351-53f5-4958-912f-43cc497ddad9	admin_analytics	1500	6	20	600	2	12	2025-08-24 22:03:06.797711+00	2025-08-24 22:03:06.797711+00
97399d1f-aeba-460c-9f4a-d19e19eb797c	webhook_processing	500	3	5	200	1	3	2025-08-24 22:03:06.797711+00	2025-08-24 22:03:06.797711+00
39620943-9068-4d5e-8ccc-883b0db59886	quote_pdf_generation	3000	4	8	1200	1	4	2025-08-24 22:03:06.797711+00	2025-08-24 22:03:06.797711+00
0807c927-d0ae-4fde-9a79-aef472d3143c	bulk_quote_operations	5000	12	25	2000	2	10	2025-08-24 22:03:06.797711+00	2025-08-24 22:03:06.797711+00
\.


--
-- Data for Name: performance_benchmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_benchmarks" ("id", "benchmark_id", "function_name", "benchmark_type", "config", "results", "performance_score", "baseline_comparison", "execution_time_ms", "test_duration_ms", "concurrency_level", "success_rate", "created_at") FROM stdin;
\.


--
-- Data for Name: performance_optimization_baselines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_optimization_baselines" ("id", "function_name", "environment", "baseline_type", "baseline_value", "measurement_unit", "confidence_interval", "sample_size", "measurement_period", "conditions", "statistical_data", "created_at") FROM stdin;
9fca881a-9a85-42fb-8402-347c94d323f8	migration-controller	production	cold_start	500	ms	{}	100	["2025-08-23 22:03:07.325114+00","2025-08-24 22:03:07.325114+00")	{}	{}	2025-08-24 22:03:07.325114+00
aa880244-beac-4023-ad6f-ad9e3f1b81aa	production-validator	production	cold_start	400	ms	{}	100	["2025-08-23 22:03:07.325114+00","2025-08-24 22:03:07.325114+00")	{}	{}	2025-08-24 22:03:07.325114+00
82b86da1-38d9-459c-88ba-96d74a0795f0	security-hardening	production	cold_start	300	ms	{}	100	["2025-08-23 22:03:07.325114+00","2025-08-24 22:03:07.325114+00")	{}	{}	2025-08-24 22:03:07.325114+00
13a195f7-f1ee-43ca-94ef-849e5ed21ceb	performance-optimizer	production	cold_start	350	ms	{}	100	["2025-08-23 22:03:07.325114+00","2025-08-24 22:03:07.325114+00")	{}	{}	2025-08-24 22:03:07.325114+00
f9c68ee4-1ee3-42fd-af9b-b5adb38e331b	monitoring-alerting	production	cold_start	450	ms	{}	100	["2025-08-23 22:03:07.325114+00","2025-08-24 22:03:07.325114+00")	{}	{}	2025-08-24 22:03:07.325114+00
\.


--
-- Data for Name: performance_optimization_test_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_optimization_test_results" ("id", "test_id", "function_name", "test_type", "test_config", "test_results", "performance_metrics", "pass_fail_criteria", "test_passed", "test_duration_ms", "concurrent_users", "total_requests", "successful_requests", "failed_requests", "average_response_time_ms", "p95_response_time_ms", "throughput_rps", "error_rate", "created_at") FROM stdin;
\.


--
-- Data for Name: performance_optimizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_optimizations" ("id", "optimization_id", "function_name", "optimization_type", "optimizations_applied", "results", "performance_before", "performance_after", "improvement_percentage", "auto_applied", "execution_time_ms", "memory_usage_mb", "success_rate", "created_at") FROM stdin;
\.


--
-- Data for Name: performance_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_recommendations" ("id", "recommendation_id", "function_name", "category", "priority", "title", "description", "recommended_actions", "expected_impact", "implementation_effort", "supporting_data", "current_performance", "expected_performance", "status", "auto_generated", "confidence_score", "created_at", "reviewed_at", "implemented_at") FROM stdin;
\.


--
-- Data for Name: performance_test_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."performance_test_results" ("id", "validation_id", "function_name", "test_type", "baseline_value", "actual_value", "target_value", "status", "test_duration_ms", "sample_size", "test_details", "created_at") FROM stdin;
5fec82f3-1341-406d-9499-50115e2ef003	template	subscription-status	response_time	500	200	200	pass	0	1	{}	2025-08-24 22:03:06.92352+00
8b02dc56-b1b7-4f73-b61e-79bfbac05c47	template	quote-processor	response_time	2500	1200	1200	pass	0	1	{}	2025-08-24 22:03:06.92352+00
a4c50bbd-7eb3-462c-9953-c43feb7fbd80	template	quote-pdf-generator	response_time	1800	800	800	pass	0	1	{}	2025-08-24 22:03:06.92352+00
ccf15614-e7d1-41f3-8145-c317d47774c9	template	webhook-handler	response_time	500	200	200	pass	0	1	{}	2025-08-24 22:03:06.92352+00
2032156f-cf82-4bfa-b51c-7ff10a191773	template	batch-processor	response_time	5000	2000	2000	pass	0	1	{}	2025-08-24 22:03:06.92352+00
e0edea04-f226-41b4-b0eb-392403f21ff1	template	webhook-monitor	response_time	800	300	300	pass	0	1	{}	2025-08-24 22:03:06.92352+00
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."quotes" ("id", "user_id", "client_id", "client_name", "client_contact", "quote_number", "quote_data", "subtotal", "tax_rate", "markup_rate", "total", "status", "sent_at", "expires_at", "follow_up_date", "notes", "is_template", "template_name", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: rate_limit_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."rate_limit_tracking" ("id", "client_ip", "request_count", "last_request", "blocked_until", "violation_count", "metadata", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: regional_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."regional_config" ("id", "region", "region_name", "enabled", "priority", "latency_threshold", "error_rate_threshold", "load_balancing_weight", "caching_strategy", "cold_start_optimization", "connection_pooling", "created_at", "updated_at") FROM stdin;
8ef98119-9074-4d93-9d35-db4ee50b26ec	us-east-1	US East (N. Virginia)	t	8	500	0.5	0.3	aggressive	t	{"idleTimeout": 300, "maxConnections": 20, "connectionTimeout": 30}	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00
eb660927-5ed9-4580-907c-4ecfb72f928b	us-west-1	US West (N. California)	t	7	600	0.5	0.25	aggressive	t	{"idleTimeout": 300, "maxConnections": 15, "connectionTimeout": 30}	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00
9d3b5227-f2d1-49c5-ba59-36af8c43482e	eu-west-1	Europe (Ireland)	t	6	800	1	0.2	conservative	t	{"idleTimeout": 300, "maxConnections": 15, "connectionTimeout": 30}	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00
9a5fadac-dc7a-4d2d-85f9-badd5d5b8292	ap-southeast-1	Asia Pacific (Singapore)	t	5	1000	1	0.15	conservative	t	{"idleTimeout": 300, "maxConnections": 10, "connectionTimeout": 30}	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00
794c43b6-7163-49ff-8d31-bce0e55adb87	ap-northeast-1	Asia Pacific (Tokyo)	t	4	1200	1.5	0.1	conservative	t	{"idleTimeout": 300, "maxConnections": 10, "connectionTimeout": 30}	2025-08-24 22:03:07.055953+00	2025-08-24 22:03:07.055953+00
\.


--
-- Data for Name: regional_performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."regional_performance_metrics" ("id", "region", "avg_response_time_ms", "error_rate", "throughput_rps", "uptime_percent", "active_connections", "cache_hit_rate", "cold_start_rate", "health_status", "last_checked", "data_points_count", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: scheduled_follow_ups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."scheduled_follow_ups" ("id", "event_type", "event_id", "user_id", "handler_used", "next_steps", "scheduled_for", "completed", "completed_at", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: security_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."security_audit_log" ("id", "event_type", "event_category", "user_id", "session_id", "source_ip", "user_agent", "resource_type", "resource_id", "action_performed", "result", "details", "risk_level", "timestamp", "function_name", "request_id", "created_at") FROM stdin;
\.


--
-- Data for Name: security_configuration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."security_configuration" ("id", "config_category", "config_key", "config_value", "enabled", "last_modified_by", "last_modified_at", "metadata", "created_at") FROM stdin;
cd0d5edc-83a6-48a1-b80e-5a1729cf5caa	rate_limiting	global_settings	{"burstLimit": 200, "blockDuration": 300, "requestsPerMinute": 100}	t	\N	2025-08-24 22:03:07.149505+00	{}	2025-08-24 22:03:07.149505+00
fd9155af-a5f5-42af-83ac-1283a1cfa1f2	threat_detection	global_settings	{"xssDetection": true, "sqlInjectionDetection": true, "commandInjectionDetection": true}	t	\N	2025-08-24 22:03:07.149505+00	{}	2025-08-24 22:03:07.149505+00
24fd2db1-bc9a-4c0b-ba51-b01719db3461	authentication	security_settings	{"requireMFA": false, "sessionTimeout": 14400, "maxFailedAttempts": 5, "accountLockoutDuration": 900}	t	\N	2025-08-24 22:03:07.149505+00	{}	2025-08-24 22:03:07.149505+00
321cfbbf-2d1f-4f15-b37c-03885267b833	data_protection	encryption_settings	{"piiDetection": true, "encryptionAtRest": true, "dataAnonymization": false, "encryptionInTransit": true}	t	\N	2025-08-24 22:03:07.149505+00	{}	2025-08-24 22:03:07.149505+00
3524a964-d763-4e4b-a6d6-dd8ac596cc41	compliance	frameworks	{"CCPA": true, "GDPR": true, "SOC2": true, "HIPAA": false, "PCI_DSS": false}	t	\N	2025-08-24 22:03:07.149505+00	{}	2025-08-24 22:03:07.149505+00
\.


--
-- Data for Name: security_incidents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."security_incidents" ("id", "incident_id", "event_type", "threat_level", "source_ip", "user_agent", "user_id", "function_name", "request_path", "payload", "response_action", "resolved", "resolved_at", "resolved_by", "resolution_notes", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: security_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."security_metrics" ("id", "metric_date", "metric_type", "metric_value", "metric_details", "calculated_at") FROM stdin;
\.


--
-- Data for Name: security_scan_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."security_scan_reports" ("id", "scan_id", "security_score", "total_tests", "passed_tests", "failed_tests", "warning_tests", "critical_issues", "high_issues", "medium_issues", "low_issues", "scan_results", "execution_time_ms", "scan_type", "created_at") FROM stdin;
\.


--
-- Data for Name: security_validation_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."security_validation_results" ("id", "validation_id", "security_category", "test_name", "severity", "status", "vulnerability_details", "remediation_steps", "compliance_standards", "test_evidence", "created_at") FROM stdin;
d734ed4c-8af6-45fa-ae23-a2c2fca54d4b	template	authentication	JWT Token Validation	critical	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
74797df1-0244-4951-bdcd-9927068f9e37	template	authorization	Admin Role Verification	critical	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
5b5a2298-d5b8-49db-8bfb-565796c50c7d	template	input_validation	SQL Injection Prevention	high	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
a59789a3-c08b-4fd2-bcd9-acc24889031c	template	input_validation	XSS Prevention	high	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
bf5d5e66-06f0-43b1-9d0d-ca19196ac702	template	cors_configuration	CORS Policy Validation	medium	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
af518d8a-d2c5-478d-9108-d7a538252281	template	environment_security	Secret Management	critical	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
6baf66fc-d1e3-4bb6-a85c-602f9924b598	template	rls_policies	Row Level Security	high	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
18c611cc-385a-4c5c-9243-51391ad1a9eb	template	data_encryption	Data at Rest Encryption	medium	pass	{}	[]	[]	{}	2025-08-24 22:03:06.92352+00
\.


--
-- Data for Name: stripe_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."stripe_products" ("id", "active", "name", "description", "image", "metadata", "created_at", "updated_at") FROM stdin;
prod_free_plan	t	Free Plan	Basic features for getting started	\N	{}	2025-08-24 22:03:06.680314+00	2025-08-24 22:03:06.680314+00
prod_premium_plan	t	Premium Plan	Advanced features for growing businesses	\N	{"analytics_access": "true"}	2025-08-24 22:03:06.680314+00	2025-08-24 22:03:06.787157+00
\.


--
-- Data for Name: stripe_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."stripe_prices" ("id", "stripe_product_id", "active", "description", "unit_amount", "currency", "type", "interval", "interval_count", "trial_period_days", "metadata", "created_at", "updated_at") FROM stdin;
price_1RriYWGgBK1ooXYFFHN7Jgsq	prod_free_plan	t	\N	0	usd	recurring	month	1	\N	{}	2025-08-24 22:03:07.442772+00	2025-08-24 22:03:07.442772+00
price_1RvGIjGgBK1ooXYF4LHswUuU	prod_premium_plan	t	\N	1200	usd	recurring	month	1	\N	{}	2025-08-24 22:03:07.442772+00	2025-08-24 22:03:07.442772+00
price_1RvGIkGgBK1ooXYFEwnMclJR	prod_premium_plan	t	\N	11520	usd	recurring	year	1	\N	{}	2025-08-24 22:03:07.442772+00	2025-08-24 22:03:07.442772+00
price_free_plan	prod_free_plan	f	\N	0	usd	recurring	month	1	\N	{}	2025-08-24 22:03:06.680314+00	2025-08-24 22:03:07.442772+00
price_premium_plan	prod_premium_plan	f	\N	2900	usd	recurring	month	1	\N	{"analytics_access": "true"}	2025-08-24 22:03:06.680314+00	2025-08-24 22:03:07.442772+00
\.


--
-- Data for Name: stripe_webhook_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."stripe_webhook_events" ("id", "stripe_event_id", "event_type", "processed", "processed_at", "error_message", "data", "created_at") FROM stdin;
\.


--
-- Data for Name: subscription_changes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."subscription_changes" ("id", "user_id", "subscription_id", "change_type", "old_value", "new_value", "timestamp", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."subscriptions" ("id", "user_id", "status", "metadata", "stripe_price_id", "quantity", "cancel_at_period_end", "created", "current_period_start", "current_period_end", "ended_at", "cancel_at", "canceled_at", "trial_start", "trial_end", "updated_at", "stripe_subscription_id") FROM stdin;
sub_admin_premium	0a8b8ce7-3cc3-476e-b820-2296df2119cf	active	{"admin_subscription": "true"}	price_1RvGIjGgBK1ooXYF4LHswUuU	1	f	2025-08-24 22:03:06.787157+00	2025-08-24 22:03:06.787157+00	2026-08-24 22:03:06.787157+00	\N	\N	\N	\N	\N	2025-08-24 22:03:07.442772+00	\N
\.


--
-- Data for Name: threat_intelligence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."threat_intelligence" ("id", "indicator_type", "indicator_value", "threat_type", "confidence_level", "severity", "description", "source", "first_seen", "last_seen", "is_active", "false_positive", "metadata", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: traffic_routing_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."traffic_routing_config" ("id", "migration_id", "function_name", "legacy_endpoint", "edge_function_endpoint", "traffic_percentage", "routing_rules", "is_active", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: user_global_item_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_global_item_usage" ("id", "user_id", "global_item_id", "is_favorite", "last_used_at", "usage_count", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_notifications" ("id", "user_id", "type", "title", "message", "read", "metadata", "created_at", "read_at") FROM stdin;
\.


--
-- Data for Name: user_onboarding_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_onboarding_preferences" ("user_id", "show_tooltips", "auto_start_tours", "preferred_tour_speed", "skip_completed_tours", "enable_animations", "preferences", "created_at", "updated_at") FROM stdin;
0a8b8ce7-3cc3-476e-b820-2296df2119cf	t	t	normal	t	t	{}	2025-08-24 22:03:07.456635+00	2025-08-24 22:03:07.456635+00
\.


--
-- Data for Name: user_onboarding_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_onboarding_progress" ("id", "user_id", "tour_id", "status", "current_step", "total_steps", "started_at", "completed_at", "last_active_at", "metadata", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_roles" ("id", "user_id", "role", "granted_by", "granted_at", "expires_at", "is_active", "metadata", "created_at", "updated_at") FROM stdin;
2ec3d946-a467-41f6-9052-6a97221ab4a5	0a8b8ce7-3cc3-476e-b820-2296df2119cf	admin	0a8b8ce7-3cc3-476e-b820-2296df2119cf	2025-08-24 22:03:06.653456+00	\N	t	{}	2025-08-24 22:03:07.417284+00	2025-08-24 22:03:07.417284+00
\.


--
-- Data for Name: user_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_usage" ("id", "user_id", "month_year", "quotes_count", "pdf_exports_count", "api_calls_count", "bulk_operations_count", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: user_usage_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_usage_history" ("id", "user_id", "month_year", "quotes_count", "pdf_exports_count", "api_calls_count", "bulk_operations_count", "archived_at") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."users" ("id", "full_name", "avatar_url", "billing_address", "payment_method", "created_at", "updated_at", "onboarding_progress", "onboarding_completed_at") FROM stdin;
0a8b8ce7-3cc3-476e-b820-2296df2119cf	Carlos Admin	\N	\N	\N	2025-08-24 22:03:06.653456+00	2025-08-24 22:03:06.653456+00	{}	\N
\.


--
-- Data for Name: vulnerability_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."vulnerability_assessments" ("id", "assessment_id", "assessment_type", "severity", "vulnerability_type", "description", "affected_component", "remediation_steps", "cvss_score", "cve_references", "status", "discovered_at", "resolved_at", "resolved_by", "verification_status", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: webhook_audit_trail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."webhook_audit_trail" ("id", "stripe_event_id", "event_type", "signature_validated", "idempotency_checked", "handler_matched", "processing_started_at", "processing_completed_at", "total_processing_time_ms", "database_changes", "external_api_calls", "user_id", "ip_address", "user_agent", "request_headers", "response_status", "response_body_summary", "created_at") FROM stdin;
\.


--
-- Data for Name: webhook_dead_letter_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."webhook_dead_letter_queue" ("id", "stripe_event_id", "event_type", "event_data", "failure_reason", "failure_count", "first_failed_at", "last_failed_at", "last_error_message", "last_error_stack", "requires_manual_review", "resolved", "resolved_at", "resolved_by", "resolution_notes", "metadata") FROM stdin;
\.


--
-- Data for Name: webhook_performance_benchmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."webhook_performance_benchmarks" ("id", "event_type", "baseline_time_ms", "target_time_ms", "current_avg_time_ms", "sample_size", "last_calculated_at", "created_at", "updated_at") FROM stdin;
3cc3d35a-9cf5-48cc-bd8b-fb6174c5d543	customer.subscription.created	500	200	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
772448e6-397d-4c61-85ec-0d0b4d8d3091	customer.subscription.updated	500	200	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
e37f5806-dfbe-4485-ae21-0cefb44dd4b3	customer.subscription.deleted	400	150	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
93193722-92f3-4336-9ac6-9ea025b842e4	checkout.session.completed	600	250	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
c771eeaf-37f0-4099-807d-958b31985221	invoice.payment_succeeded	300	120	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
3833ca03-661e-42ea-9b21-3e81741472b0	invoice.payment_failed	300	120	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
f068965f-73c4-402e-80a2-cc9cc946cb3d	setup_intent.succeeded	400	160	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
0981ad36-f682-4fed-b635-8fdcf1cdd8f0	payment_method.attached	300	120	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
e20aa314-9926-4d89-93bd-8cbbbc9f66e8	product.created	200	80	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
4e47911e-0c5c-4368-bbf4-ea7208464288	product.updated	200	80	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
d4d62144-beef-4138-9544-aeabd074a578	price.created	200	80	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
76f064d7-7fed-4eb9-9b5a-74782c0f01bb	price.updated	200	80	\N	0	\N	2025-08-24 22:03:06.839937+00	2025-08-24 22:03:06.839937+00
\.


--
-- Data for Name: webhook_processing_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."webhook_processing_logs" ("id", "stripe_event_id", "event_type", "processing_stage", "status", "handler_name", "execution_time_ms", "database_queries", "api_calls_made", "error_message", "error_stack", "retry_attempt", "metadata", "created_at") FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at") FROM stdin;
documents	documents	\N	2025-08-24 22:03:06.817136+00	2025-08-24 22:03:06.817136+00
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata") FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY "supabase_functions"."hooks" ("id", "hook_table_id", "hook_name", "created_at", "request_id") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: admin_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."admin_settings_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
