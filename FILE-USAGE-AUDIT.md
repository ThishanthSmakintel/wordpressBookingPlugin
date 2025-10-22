# AppointEase Plugin - Complete File Usage Audit

**Generated:** 2025-01-XX  
**Purpose:** Identify which files are actively used vs. unused/redundant

---

## ✅ CRITICAL FILES (ACTIVELY USED)

### Core Plugin Files
| File | Status | Purpose |
|------|--------|---------|
| `booking-plugin.php` | ✅ USED | Main plugin entry point |
| `includes/class-booking-plugin.php` | ✅ USED | Core plugin orchestrator |
| `includes/class-api-endpoints.php` | ✅ USED | REST API routes |
| `includes/class-activator.php` | ✅ USED | Plugin activation |
| `includes/class-deactivator.php` | ✅ USED | Plugin deactivation |
| `includes/class-settings.php` | ✅ USED | Admin settings |
| `includes/class-db-seeder.php` | ✅ USED | Database seeding |
| `includes/class-db-reset.php` | ✅ USED | Database reset |
| `includes/class-db-reset-filters.php` | ✅ USED | Reset filters |
| `includes/class-heartbeat-handler.php` | ✅ USED | Real-time updates |
| `includes/session-manager.php` | ✅ USED | Session management |
| `includes/index.php` | ✅ USED | Security (prevent direct access) |

### Admin Files
| File | Status | Purpose |
|------|--------|---------|
| `admin/appointease-admin.php` | ✅ USED | Admin dashboard |
| `admin/appointease-admin.css` | ✅ USED | Admin styling |
| `admin/appointease-admin.js` | ✅ USED | Admin JavaScript |
| `admin/db-reset-admin.php` | ✅ USED | Database management UI |
| `admin/index.php` | ✅ USED | Security |

### Frontend React App (NEW MODULAR STRUCTURE)
| File | Status | Purpose |
|------|--------|---------|
| `src/app/index.ts` | ✅ USED | Main app export |
| `src/app/core/BookingApp.tsx` | ✅ USED | Core application component |

#### Features (Modular)
| File | Status | Purpose |
|------|--------|---------|
| `src/app/features/booking/components/BookingFlow.tsx` | ✅ USED | 7-step booking flow |
| `src/app/features/booking/components/ServiceSelector.component.tsx` | ✅ USED | Service selection |
| `src/app/features/booking/components/StaffSelector.component.tsx` | ✅ USED | Staff selection |
| `src/app/features/booking/components/DateTimeSelector.component.tsx` | ✅ USED | Date/time selection |
| `src/app/features/booking/components/CustomerInfoForm.component.tsx` | ✅ USED | Customer form |
| `src/app/features/booking/components/BookingConfirmation.component.tsx` | ✅ USED | Confirmation step |
| `src/app/features/appointments/components/AppointmentDashboard.component.tsx` | ✅ USED | Dashboard view |
| `src/app/features/appointments/components/AppointmentManager.component.tsx` | ✅ USED | Manage appointments |
| `src/app/features/authentication/components/LoginForm.component.tsx` | ✅ USED | Login form |
| `src/app/features/authentication/components/EmailVerification.component.tsx` | ✅ USED | Email OTP verification |
| `src/app/features/debug/components/DebugPanel.component.tsx` | ✅ USED | Debug panel |
| `src/app/features/debug/hooks/useDebugState.hook.ts` | ✅ USED | Debug state hook |

#### Shared Resources
| File | Status | Purpose |
|------|--------|---------|
| `src/app/shared/components/layout/BookingHeader.component.tsx` | ✅ USED | Header component |
| `src/app/shared/components/ui/ConnectionStatus.component.tsx` | ✅ USED | Online/offline status |
| `src/app/shared/components/ui/StepProgress.component.tsx` | ✅ USED | Progress indicator |
| `src/app/shared/components/ui/TimeWidget.component.tsx` | ✅ USED | Time display |
| `src/app/shared/components/SuccessPage.tsx` | ✅ USED | Success page |
| `src/app/shared/components/ErrorBoundary.tsx` | ✅ USED | Error handling |
| `src/app/shared/components/AppointmentSummary.tsx` | ✅ USED | Appointment summary |
| `src/app/shared/components/RescheduleHeader.tsx` | ✅ USED | Reschedule header |
| `src/app/shared/components/StepWrapper.tsx` | ✅ USED | Step wrapper |
| `src/app/shared/hooks/useBookingState.hook.ts` | ✅ USED | Booking state hook |
| `src/app/shared/store/bookingStore.ts` | ✅ USED | Zustand store |
| `src/app/shared/types/booking.types.ts` | ✅ USED | TypeScript types |
| `src/app/shared/constants/booking.constants.ts` | ✅ USED | Constants |
| `src/app/shared/services/booking.service.ts` | ✅ USED | API service |
| `src/app/shared/services/settings.service.ts` | ✅ USED | Settings service |
| `src/app/shared/utils/booking.utils.ts` | ✅ USED | Utility functions |
| `src/app/shared/utils/dateFormatters.ts` | ✅ USED | Date formatting |

### Legacy Components (STILL USED - TO BE MIGRATED)
| File | Status | Purpose | Migration Status |
|------|--------|---------|------------------|
| `src/components/pages/Dashboard.tsx` | ✅ USED | Dashboard page | ⚠️ Being replaced by modular version |
| `src/components/forms/LoginForm.tsx` | ✅ USED | Login form | ⚠️ Being replaced by modular version |
| `src/components/forms/ServiceSelector.tsx` | ✅ USED | Service selector | ⚠️ Being replaced by modular version |
| `src/components/forms/EmployeeSelector.tsx` | ✅ USED | Employee selector | ⚠️ Being replaced by modular version |
| `src/components/forms/DateSelector.tsx` | ✅ USED | Date selector | ⚠️ Being replaced by modular version |
| `src/components/forms/TimeSelector.tsx` | ✅ USED | Time selector | ⚠️ Being replaced by modular version |
| `src/components/forms/CustomerInfoForm.tsx` | ✅ USED | Customer form | ⚠️ Being replaced by modular version |
| `src/components/forms/EmailVerification.tsx` | ✅ USED | Email verification | ⚠️ Being replaced by modular version |
| `src/components/pages/BookingSuccessPage.tsx` | ✅ USED | Success page | ⚠️ Being replaced by modular version |
| `src/components/ui/ConnectionStatus.tsx` | ✅ USED | Connection status | ⚠️ Being replaced by modular version |
| `src/components/ui/StepProgress.tsx` | ✅ USED | Step progress | ⚠️ Being replaced by modular version |
| `src/components/index.ts` | ✅ USED | Component exports | ⚠️ To be removed after migration |

### Modules (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/modules/DebugPanel.tsx` | ✅ USED | Debug panel |
| `src/modules/AppointmentManager.tsx` | ✅ USED | Appointment manager |
| `src/modules/BookingHeader.tsx` | ✅ USED | Booking header |
| `src/modules/CurrentTimeWidget.tsx` | ✅ USED | Time widget |
| `src/modules/TimeSync.tsx` | ✅ USED | Time synchronization |

### Hooks (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/hooks/useBookingState.ts` | ✅ USED | Booking state management |
| `src/hooks/useDebugState.ts` | ✅ USED | Debug state management |
| `src/hooks/useBookingActions.ts` | ✅ USED | Booking actions |

### Services (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/services/api.ts` | ✅ USED | API client |
| `src/services/sessionService.ts` | ✅ USED | Session management |

### Store (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/store/bookingStore.ts` | ✅ USED | Zustand global store |

### Types (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/types/index.ts` | ✅ USED | TypeScript definitions |

### Utils (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/utils/index.ts` | ✅ USED | Utility functions |
| `src/utils/screenshotCapture.ts` | ✅ USED | Screenshot utility |

### Constants (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/constants/index.ts` | ✅ USED | App constants |

### Styles (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `src/assets/styles/frontend/index.css` | ✅ USED | Main frontend styles |
| `src/assets/styles/frontend/frontend.css` | ✅ USED | Frontend styles |
| `src/assets/styles/frontend/frontend.scss` | ✅ USED | SCSS source |
| `src/assets/styles/frontend/login.css` | ✅ USED | Login styles |
| `src/assets/styles/frontend/reschedule.css` | ✅ USED | Reschedule styles |
| `src/assets/styles/frontend/appearance.css` | ✅ USED | Appearance styles |
| `src/assets/styles/frontend/wp-responsive-fix.css` | ✅ USED | WordPress fixes |
| `src/assets/styles/components/*.css` | ✅ USED | Component-specific styles |
| `src/assets/styles/editor/*.scss` | ✅ USED | Editor styles |
| `src/assets/styles/scss/*.scss` | ✅ USED | SCSS partials |

### Blocks (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `blocks/index.js` | ✅ USED | Block entry point |
| `blocks/block.tsx` | ✅ USED | Gutenberg block |
| `blocks/index.php` | ✅ USED | Security |

### Build Configuration (ACTIVELY USED)
| File | Status | Purpose |
|------|--------|---------|
| `webpack.config.js` | ✅ USED | Webpack configuration |
| `package.json` | ✅ USED | NPM dependencies |
| `tsconfig.json` | ✅ USED | TypeScript config |
| `block.json` | ✅ USED | Block metadata |

---

## ⚠️ DUPLICATE FILES (REDUNDANT)

### Duplicate React Entry Point
| File | Status | Issue |
|------|--------|-------|
| `src/BookingApp.tsx` | ❌ DUPLICATE | Older version of `src/app/core/BookingApp.tsx` |

**Analysis:**
- `src/BookingApp.tsx` is an older version with inline step rendering
- `src/app/core/BookingApp.tsx` is the new modular version
- Webpack uses `src/app/index.ts` which exports the new version
- **Action:** Can be safely deleted

---

## 🧪 TEST FILES (DEVELOPMENT ONLY)

### Test Suites
| File | Status | Purpose |
|------|--------|---------|
| `tests/bootstrap.php` | 🧪 DEV | PHPUnit bootstrap |
| `tests/php/unit/test-booking-plugin.php` | 🧪 DEV | PHP unit tests |
| `tests/php/api/test-api-endpoints.php` | 🧪 DEV | API tests |
| `tests/js/unit/TimeSelector.test.tsx` | 🧪 DEV | React unit tests |
| `tests/js/integration/booking-flow.test.tsx` | 🧪 DEV | Integration tests |
| `tests/js/e2e/booking-flow.cy.js` | 🧪 DEV | Cypress E2E tests |
| `tests/js/setup.js` | 🧪 DEV | Jest setup |
| `tests/fixtures/test-data.php` | 🧪 DEV | Test data |
| `jest.config.js` | 🧪 DEV | Jest configuration |
| `cypress.config.js` | 🧪 DEV | Cypress configuration |
| `phpunit.xml` | 🧪 DEV | PHPUnit configuration |

**Status:** Keep for development, exclude from production builds

---

## 🔧 UTILITY/DEBUG FILES (DEVELOPMENT ONLY)

### Debug Scripts
| File | Status | Purpose |
|------|--------|---------|
| `add-test-appointment.php` | 🔧 DEBUG | Add test data |
| `check-appointment.php` | 🔧 DEBUG | Check appointments |
| `debug-appointment.php` | 🔧 DEBUG | Debug appointments |
| `fix-appointments.php` | 🔧 DEBUG | Fix data issues |
| `search-api.php` | 🔧 DEBUG | API search |
| `seed-data.php` | 🔧 DEBUG | Seed database |
| `test-api.php` | 🔧 DEBUG | Test API |
| `test-features.php` | 🔧 DEBUG | Test features |
| `test-persistent-login.html` | 🔧 DEBUG | Test login |
| `test_endpoint_registration.php` | 🔧 DEBUG | Test endpoints |
| `update-db.php` | 🔧 DEBUG | Update database |
| `reset-usage-examples.php` | 🔧 DEBUG | Reset examples |

### Python Debug Scripts
| File | Status | Purpose |
|------|--------|---------|
| `debug_api_response.py` | 🔧 DEBUG | Debug API responses |
| `detailed_api_test.py` | 🔧 DEBUG | Detailed API testing |
| `test_apis.py` | 🔧 DEBUG | Test APIs |
| `test_live_api.py` | 🔧 DEBUG | Test live API |

**Status:** Keep for development, exclude from production

---

## 📚 DOCUMENTATION FILES

### Documentation
| File | Status | Purpose |
|------|--------|---------|
| `README.md` | 📚 DOCS | Main documentation |
| `REACT-STRUCTURE.md` | 📚 DOCS | React architecture |
| `COLOR_PALETTE_GUIDE.md` | 📚 DOCS | Color system |
| `COLOR_INCONSISTENCY_FIX.md` | 📚 DOCS | Color fixes |
| `ROLE_BASED_COLOR_SYSTEM.md` | 📚 DOCS | Role colors |
| `SECURITY-FIXES.md` | 📚 DOCS | Security documentation |
| `SECURITY-FIXES-APPLIED.md` | 📚 DOCS | Applied fixes |
| `HALLUCINATION-FIXES.md` | 📚 DOCS | AI fixes |
| `changelog.txt` | 📚 DOCS | Version history |
| `LICENSE` | 📚 DOCS | GPL license |
| `src/assets/styles/README.md` | 📚 DOCS | Styles documentation |
| `tests/README.md` | 📚 DOCS | Testing guide |

### Debug Screenshots
| Directory | Status | Purpose |
|-----------|--------|---------|
| `debug-screenshots/` | 📚 DOCS | Visual debugging |
| `debug-screenshots/errors/` | 📚 DOCS | Error screenshots |
| `debug-screenshots/flows/` | 📚 DOCS | Flow screenshots |
| `debug-screenshots/ui-states/` | 📚 DOCS | UI state screenshots |
| `debug-screenshots/README.md` | 📚 DOCS | Screenshot guide |
| `debug-screenshots/SCREENSHOT-LOG.md` | 📚 DOCS | Screenshot log |

**Status:** Keep for reference

---

## 🔒 SECURITY/CONFIG FILES

### Security & Configuration
| File | Status | Purpose |
|------|--------|---------|
| `index.php` | 🔒 SECURITY | Prevent directory listing |
| `assets/index.php` | 🔒 SECURITY | Prevent directory listing |
| `languages/index.php` | 🔒 SECURITY | Prevent directory listing |
| `.gitignore` | 🔒 CONFIG | Git ignore rules |
| `.editorconfig` | 🔒 CONFIG | Editor configuration |
| `.env.example` | 🔒 CONFIG | Environment template |
| `phpcs.xml` | 🔒 CONFIG | PHP CodeSniffer |
| `composer.json` | 🔒 CONFIG | PHP dependencies |
| `uninstall.php` | 🔒 CLEANUP | Plugin uninstall |

**Status:** Keep all

---

## 🗑️ UNUSED/REDUNDANT FILES TO REMOVE

### Files Safe to Delete
| File | Reason |
|------|--------|
| `src/BookingApp.tsx` | ❌ Duplicate of `src/app/core/BookingApp.tsx` |
| `admin/admin-notifications.js` | ❓ Check if used in admin |
| `admin/calendar-integration.js` | ❓ Check if used in admin |
| `includes/class-screenshot-handler.php` | ❓ Check if actively used |

---

## 📊 MIGRATION STATUS

### Legacy → Modular Migration Progress

| Component | Legacy Location | New Location | Status |
|-----------|----------------|--------------|--------|
| BookingApp | `src/BookingApp.tsx` | `src/app/core/BookingApp.tsx` | ✅ MIGRATED |
| ServiceSelector | `src/components/forms/` | `src/app/features/booking/components/` | ⚠️ PARTIAL |
| StaffSelector | `src/components/forms/` | `src/app/features/booking/components/` | ⚠️ PARTIAL |
| DateTimeSelector | `src/components/forms/` | `src/app/features/booking/components/` | ⚠️ PARTIAL |
| CustomerInfoForm | `src/components/forms/` | `src/app/features/booking/components/` | ⚠️ PARTIAL |
| LoginForm | `src/components/forms/` | `src/app/features/authentication/components/` | ⚠️ PARTIAL |
| EmailVerification | `src/components/forms/` | `src/app/features/authentication/components/` | ⚠️ PARTIAL |
| Dashboard | `src/components/pages/` | `src/app/features/appointments/components/` | ⚠️ PARTIAL |
| AppointmentManager | `src/modules/` | `src/app/features/appointments/components/` | ⚠️ PARTIAL |
| DebugPanel | `src/modules/` | `src/app/features/debug/components/` | ⚠️ PARTIAL |

**Note:** Both legacy and modular versions exist. Legacy versions are still imported in `src/app/core/BookingApp.tsx` but should be replaced with modular versions.

---

## 🎯 RECOMMENDATIONS

### Immediate Actions
1. ✅ **Delete** `src/BookingApp.tsx` (duplicate)
2. ⚠️ **Verify** admin JavaScript files usage
3. ⚠️ **Verify** screenshot handler usage
4. 📦 **Complete** migration from legacy to modular components
5. 🧹 **Remove** legacy component imports after migration

### Migration Plan
1. Update `src/app/core/BookingApp.tsx` to use only modular components
2. Remove legacy component imports
3. Delete legacy component files
4. Update documentation

### Production Build Exclusions
Exclude from production builds:
- `tests/` directory
- `debug-screenshots/` directory
- All `*.test.tsx` files
- All `*.cy.js` files
- Python debug scripts
- PHP debug scripts
- `.md` documentation files (except README.md)

---

## 📈 FILE COUNT SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Core PHP Files | 12 | ✅ All Used |
| Admin Files | 5 | ✅ All Used |
| React Components (New) | 25+ | ✅ All Used |
| React Components (Legacy) | 11 | ⚠️ To Migrate |
| Hooks | 3 | ✅ All Used |
| Services | 2 | ✅ All Used |
| Store | 1 | ✅ All Used |
| Styles | 20+ | ✅ All Used |
| Test Files | 10+ | 🧪 Dev Only |
| Debug Scripts | 15+ | 🔧 Dev Only |
| Documentation | 10+ | 📚 Reference |
| Duplicate Files | 1 | ❌ Delete |

**Total Files:** ~150+  
**Production Files:** ~80  
**Development Files:** ~70

---

## ✅ CONCLUSION

### Current State
- **Dual Architecture:** Both legacy and modular React structures coexist
- **Webpack Entry:** Uses new modular structure (`src/app/index.ts`)
- **Legacy Imports:** Still imported in new BookingApp for backward compatibility
- **One Duplicate:** `src/BookingApp.tsx` is redundant

### Next Steps
1. Complete component migration to modular structure
2. Remove legacy component imports
3. Delete duplicate `src/BookingApp.tsx`
4. Clean up unused admin scripts
5. Document final architecture

### Production Readiness
- ✅ Core functionality uses new modular structure
- ✅ Build process configured correctly
- ⚠️ Legacy components still present but not blocking
- ✅ No critical unused files affecting performance
