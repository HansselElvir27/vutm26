# Notifications Implementation Plan

## Task
Create the following notifications:
1. **For Naviera**: Notification when an arrival passes to "Ready for ZARPE" status
2. **For CIM**: Notification when an arrival passes to "Ready for ZARPE" status  
3. **For Capitan**: Notification when CIM has pre-approved the arrival

## Implementation Complete ✅

### Files Modified:

1. **app/actions/notifications.ts**
   - Added new notification types: `ready_for_zarpe` and `cim_pre_approved`
   - Added `notifyReadyForZarpe()` function - sends notifications to both Naviera and CIM
   - Added `notifyCIMPreApproved()` function - notifies Captain when CIM pre-approves

2. **app/actions/approvals.ts**
   - Imported `notifyReadyForZarpe` from notifications
   - Added notification trigger in `approveArrival()` function when status changes to `ready_for_zarpe`
   - Notifies both the Naviera (agent who created the arrival) and CIM official

3. **app/actions/zarpe.ts**
   - Imported `notifyCIMPreApproved` from notifications
   - Added notification trigger in `approveCIMZarpe()` function
   - Notifies the Captain (capitan_puerto) when CIM has pre-approved the zarpe

## Notification Flow:

1. **Naviera & CIM** receive notification when:
   - All required authorities (capitan_puerto, aduanas, migracion, salud) approve the arrival
   - Status changes to `ready_for_zarpe`

2. **Capitan** receives notification when:
   - CIM official pre-approves the zarpe via `approveCIMZarpe()`
   - Status remains pending until captain gives final approval

