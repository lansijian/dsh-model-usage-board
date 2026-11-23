param(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][string]$Title,
  [Parameter(Mandatory = $true)][string]$Profile,
  [int]$X = -1,
  [int]$Y = 80,
  [int]$Width = 450,
  [int]$Height = 770
)

$ErrorActionPreference = 'Stop'
$log = Join-Path (Split-Path $Profile -Parent) 'floating-window.log'
"$(Get-Date -Format o) start $Title" | Set-Content -Encoding utf8 $log

try {
  $env:PATH = (Join-Path $PSScriptRoot 'webview2') + ';' + $env:PATH
  Add-Type -AssemblyName PresentationFramework
  Add-Type -AssemblyName PresentationCore
  Add-Type -AssemblyName WindowsBase
  Add-Type -Path (Join-Path $PSScriptRoot 'webview2\Microsoft.Web.WebView2.Core.dll')
  Add-Type -Path (Join-Path $PSScriptRoot 'webview2\Microsoft.Web.WebView2.Wpf.dll')

  $vsLeft = [int][System.Windows.SystemParameters]::VirtualScreenLeft
  $vsTop = [int][System.Windows.SystemParameters]::VirtualScreenTop
  $vsRight = $vsLeft + [int][System.Windows.SystemParameters]::VirtualScreenWidth
  $vsBottom = $vsTop + [int][System.Windows.SystemParameters]::VirtualScreenHeight
  if ($X -lt $vsLeft -or $X + $Width -gt $vsRight) {
    $X = [int]([System.Windows.SystemParameters]::WorkArea.Right - $Width - 24)
  }
  if ($Y -lt $vsTop -or $Y + $Height -gt $vsBottom) {
    $Y = $vsTop + 80
  }
  $window = New-Object System.Windows.Window
  $window.Title = $Title
  $window.Width = $Width
  $window.Height = $Height
  $window.Left = $X
  $window.Top = $Y
  $window.WindowStyle = 'None'
  $window.ResizeMode = 'NoResize'
  $window.WindowStartupLocation = 'Manual'
  $window.Topmost = $true
  $window.ShowInTaskbar = $false
  $window.Background = [System.Windows.Media.SolidColorBrush]::new(
    [System.Windows.Media.Color]::FromRgb(4, 11, 22)
  )
  $script:floatingWindow = $window

  $view = New-Object Microsoft.Web.WebView2.Wpf.WebView2
  $view.DefaultBackgroundColor = [System.Drawing.Color]::FromArgb(255, 4, 11, 22)
  $creation = New-Object Microsoft.Web.WebView2.Wpf.CoreWebView2CreationProperties
  $creation.UserDataFolder = $Profile
  $view.CreationProperties = $creation

  $grid = New-Object System.Windows.Controls.Grid
  $rowGrip = New-Object System.Windows.Controls.RowDefinition
  $rowGrip.Height = New-Object System.Windows.GridLength(26)
  $rowView = New-Object System.Windows.Controls.RowDefinition
  $rowView.Height = New-Object System.Windows.GridLength(1, [System.Windows.GridUnitType]::Star)
  $grid.RowDefinitions.Add($rowGrip)
  $grid.RowDefinitions.Add($rowView)

  $grip = New-Object System.Windows.Controls.Border
  $grip.Background = [System.Windows.Media.SolidColorBrush]::new(
    [System.Windows.Media.Color]::FromRgb(10, 15, 26)
  )
  $grip.BorderBrush = [System.Windows.Media.SolidColorBrush]::new(
    [System.Windows.Media.Color]::FromArgb(40, 255, 255, 255)
  )
  $grip.BorderThickness = New-Object System.Windows.Thickness(0, 0, 0, 1)
  $grip.Cursor = [System.Windows.Input.Cursors]::SizeAll
  $grip.ToolTip = '拖动到任意显示器 / Drag to any monitor'
  $gripLabel = New-Object System.Windows.Controls.TextBlock
  $gripLabel.Text = '⠿  模型用量'
  $gripLabel.FontSize = 10
  $gripLabel.HorizontalAlignment = 'Center'
  $gripLabel.VerticalAlignment = 'Center'
  $gripLabel.Foreground = [System.Windows.Media.SolidColorBrush]::new(
    [System.Windows.Media.Color]::FromRgb(160, 180, 200)
  )
  $grip.Child = $gripLabel
  $grip.Add_MouseLeftButtonDown({ $script:floatingWindow.DragMove() })
  [System.Windows.Controls.Grid]::SetRow($grip, 0)
  [System.Windows.Controls.Grid]::SetRow($view, 1)
  $grid.Children.Add($grip) | Out-Null
  $grid.Children.Add($view) | Out-Null
  $window.Content = $grid

  $view.add_CoreWebView2InitializationCompleted({
    param($sender, $eventArgs)
    "init event success=$($eventArgs.IsSuccess)" | Add-Content -Encoding utf8 $log
    if (-not $eventArgs.IsSuccess) {
      "webview init failed: $($eventArgs.InitializationException)" | Add-Content -Encoding utf8 $log
      return
    }
    $core = $sender.CoreWebView2
    $core.Settings.AreDefaultContextMenusEnabled = $false
    $core.Settings.AreDevToolsEnabled = $false
    $core.Settings.IsStatusBarEnabled = $false
    $core.add_WebMessageReceived({
      param($source, $message)
      $text = [string]$message.WebMessageAsJson
      if ($text -match 'close') {
        $script:floatingWindow.Close()
      } elseif ($text -match 'drag') {
        try { $script:floatingWindow.DragMove() } catch { }
      }
    })
    $core.Navigate($Url)
    "webview ready" | Add-Content -Encoding utf8 $log
  })

  $window.Add_Loaded({
    try { $view.EnsureCoreWebView2Async($null) | Out-Null } catch {
      "ensure failed: $_" | Add-Content -Encoding utf8 $log
    }
  })

  $window.Add_Closed({
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.InvokeShutdown()
  })

  $window.Show()
  "window shown $X,$Y" | Add-Content -Encoding utf8 $log
  [System.Windows.Threading.Dispatcher]::Run()
  "window closed" | Add-Content -Encoding utf8 $log
} catch {
  "ERROR $($_ | Out-String)" | Add-Content -Encoding utf8 $log
  throw
}
