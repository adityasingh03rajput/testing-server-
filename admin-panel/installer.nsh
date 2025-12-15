; Custom NSIS installer script
!macro customInstall
  ; Create shortcuts
  CreateShortCut "$DESKTOP\College Attendance Admin.lnk" "$INSTDIR\College Attendance Admin.exe"
  CreateDirectory "$SMPROGRAMS\College Attendance"
  CreateShortCut "$SMPROGRAMS\College Attendance\College Attendance Admin.lnk" "$INSTDIR\College Attendance Admin.exe"
  CreateShortCut "$SMPROGRAMS\College Attendance\Uninstall.lnk" "$INSTDIR\Uninstall College Attendance Admin.exe"
!macroend

!macro customUnInstall
  ; Remove shortcuts
  Delete "$DESKTOP\College Attendance Admin.lnk"
  Delete "$SMPROGRAMS\College Attendance\College Attendance Admin.lnk"
  Delete "$SMPROGRAMS\College Attendance\Uninstall.lnk"
  RMDir "$SMPROGRAMS\College Attendance"
!macroend
