# WordPress Data Store Migration Script
Write-Host 'Starting WordPress Data Store Migration...' -ForegroundColor Cyan

$files = @(
    'src\components\forms\CustomerInfoForm.tsx',
    'src\components\forms\DateSelector.tsx',
    'src\components\forms\EmailVerification.tsx',
    'src\components\pages\BookingSuccessPage.tsx',
    'src\components\pages\Dashboard.tsx',
    'src\components\ui\ConnectionStatus.tsx',
    'src\components\ui\StepProgress.tsx',
    'src\app\features\booking\components\BookingFlow.tsx',
    'src\app\features\booking\components\ServiceSelector.component.tsx',
    'src\app\features\booking\components\StaffSelector.component.tsx',
    'src\app\shared\components\ui\ConnectionStatus.component.tsx',
    'src\app\shared\components\ui\StepProgress.component.tsx',
    'src\app\core\BookingApp.tsx',
    'src\hooks\useBookingActions.ts',
    'src\modules\DebugPanel.tsx'
)

$migratedCount = 0
$errorCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Migrating $file..." -ForegroundColor Yellow
        
        try {
            $content = Get-Content $file -Raw -ErrorAction Stop
            
            $content = $content -replace "import \{ useBookingStore \} from '\.\.\/\.\.\/store\/bookingStore';", "import { useAppointmentStore as useBookingStore } from '../../hooks/useAppointmentStore';"
            $content = $content -replace "import \{ useBookingStore \} from '\.\.\/\.\.\/\.\.\/\.\.\/store\/bookingStore';", "import { useAppointmentStore as useBookingStore } from '../../../../hooks/useAppointmentStore';"
            $content = $content -replace "import \{ useBookingStore \} from '\.\.\/\.\.\/\.\.\/shared\/store\/bookingStore';", "import { useAppointmentStore as useBookingStore } from '../../../shared/hooks/useAppointmentStore';"
            $content = $content -replace "import \{ useBookingStore \} from '\.\.\/store\/bookingStore';", "import { useAppointmentStore as useBookingStore } from '../hooks/useAppointmentStore';"
            
            Set-Content $file $content -ErrorAction Stop
            Write-Host "Successfully migrated $file" -ForegroundColor Green
            $migratedCount++
        }
        catch {
            Write-Host "Error migrating $file" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "File not found: $file" -ForegroundColor DarkYellow
    }
}

Write-Host ''
Write-Host 'Migration Summary:' -ForegroundColor Cyan
Write-Host "Successfully migrated: $migratedCount files" -ForegroundColor Green
Write-Host "Errors: $errorCount files" -ForegroundColor Red
Write-Host ''
Write-Host 'Migration complete!' -ForegroundColor Green
