# 01 - Project Overview

## Purpose
BuildTrack is a centralized digital solution tailored for construction project management. It bridges the gap between on-site physical construction execution and high-level corporate treasury, financial oversight, and workforce management.

## Problem Statement
Construction firms traditionally struggle with fragmented data. Project Managers use one tool for tasks, Finance uses another for payroll and expenses, and field workers use WhatsApp or paper for daily logs. This leads to lost data, inaccurate Bill of Quantities (BOQ) tracking, and delayed loan/purchase approvals.

## Objectives
- **Centralize Data**: Unify project milestones, daily logs, and financial ledger into one PostgreSQL database.
- **Real-Time Financial Tracking**: Live tracking of BOQ estimates vs. actual spend.
- **Loan & Purchase Tracking**: Seamlessly manage company bank loans and allocate purchase orders directly against loan facilities.
- **Accessibility**: Provide a robust web dashboard for office staff and a lightweight mobile app for field workers.

## Features
- **Project Details & BOQ Tracking**: Track estimated vs. actual expenses per project.
- **Finance & Treasury Module**: Manage bank loans, record repayments, and view cash flow comparisons.
- **Workforce & Subcontractors**: Track daily wages, subcontractor completion status, and active disputes.
- **Task Scheduling**: Manage critical paths and milestones.
- **Rich Analytics**: Visual representations of spending by category via Grafana & custom Next.js charts.

## Users & Roles
1. **Super Admin**: Full access to all systems, user management, and infrastructure settings.
2. **Finance Manager (Treasury)**: Access to the Finance tab, Bank Loans, Repayments, and Payroll.
3. **Project Manager**: Access to Project Creation, Task Scheduling, BOQ editing, and Subcontractor assignments.
4. **Site Supervisor (Mobile)**: Can submit daily logs, upload images, and update task statuses.
5. **Subcontractor (Mobile)**: Limited view of assigned tasks and contract status.

## Business Value
By preventing budget overruns through real-time BOQ variance tracking, BuildTrack directly saves capital. The automated tracking of Bank Loans ensures timely repayments, avoiding penalty interest and maintaining the firm's credit rating.

## Screens Overview
- **Dashboard**: High-level quick navigation, project status breakdown, and recent activity.
- **Finance**: Bank loans table, expense ledgers, and cash flow charts.
- **Projects**: List of active/completed projects, nested detailed view with Maps, BOQ, Tasks, and Logs.
- **Reports**: Granular breakdown of categories, costs, and printable statements.
- **Workers/Subcontractors**: Tables managing human resources and contract statuses.
