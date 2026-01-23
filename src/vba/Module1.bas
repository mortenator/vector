Attribute VB_Name = "VectorCharts"
Option Explicit

' Vector PowerPoint Add-in
' Chart insertion module using native PowerPoint chart API

' ============================================================================
' Ribbon Callback Handlers
' ============================================================================

Sub InsertBarChart(control As IRibbonControl)
    InsertChart xlBarClustered, "Bar Chart"
End Sub

Sub InsertColumnChart(control As IRibbonControl)
    InsertChart xlColumnClustered, "Column Chart"
End Sub

Sub InsertLineChart(control As IRibbonControl)
    InsertChart xlLine, "Line Chart"
End Sub

Sub InsertPieChart(control As IRibbonControl)
    InsertChart xlPie, "Pie Chart"
End Sub

Sub InsertAreaChart(control As IRibbonControl)
    InsertChart xlArea, "Area Chart"
End Sub

Sub InsertScatterChart(control As IRibbonControl)
    InsertChart xlXYScatter, "Scatter Chart"
End Sub

Sub InsertComboChart(control As IRibbonControl)
    InsertComboChartWithData
End Sub

Sub RefreshChartData(control As IRibbonControl)
    RefreshSelectedChart
End Sub

Sub ShowAbout(control As IRibbonControl)
    MsgBox "Vector for PowerPoint" & vbCrLf & vbCrLf & _
           "Version 1.0" & vbCrLf & _
           "A Think-cell inspired chart add-in" & vbCrLf & vbCrLf & _
           "Insert professional charts with one click.", _
           vbInformation, "About Vector"
End Sub

' ============================================================================
' Chart Insertion Functions
' ============================================================================

Private Sub InsertChart(chartType As XlChartType, chartName As String)
    On Error GoTo ErrorHandler

    Dim sld As Slide
    Dim shp As Shape
    Dim chartLeft As Single
    Dim chartTop As Single
    Dim chartWidth As Single
    Dim chartHeight As Single

    ' Check if we have an active presentation
    If ActivePresentation Is Nothing Then
        MsgBox "Please open a presentation first.", vbExclamation, "Vector"
        Exit Sub
    End If

    ' Get current slide
    Set sld = ActiveWindow.View.Slide

    ' Calculate center position
    chartWidth = 400
    chartHeight = 300
    chartLeft = (ActivePresentation.PageSetup.SlideWidth - chartWidth) / 2
    chartTop = (ActivePresentation.PageSetup.SlideHeight - chartHeight) / 2

    ' Insert chart
    Set shp = sld.Shapes.AddChart2(-1, chartType, chartLeft, chartTop, chartWidth, chartHeight)
    shp.Name = "Vector_" & chartName & "_" & Format(Now, "hhmmss")

    ' Add sample data
    PopulateChartData shp.Chart, chartType

    ' Select the new chart
    shp.Select

    Exit Sub

ErrorHandler:
    MsgBox "Error inserting chart: " & Err.Description, vbCritical, "Vector"
End Sub

Private Sub PopulateChartData(cht As Chart, chartType As XlChartType)
    On Error Resume Next

    Dim ws As Object

    With cht.ChartData
        .Activate
        Set ws = .Workbook.Sheets(1)

        ' Clear existing data
        ws.Cells.Clear

        If chartType = xlPie Then
            ' Pie chart data
            ws.Range("A1").Value = "Category"
            ws.Range("B1").Value = "Value"
            ws.Range("A2:B5").Value = Array( _
                Array("Product A", 35), _
                Array("Product B", 28), _
                Array("Product C", 22), _
                Array("Product D", 15))
            cht.SetSourceData ws.Range("A1:B5")
        Else
            ' Standard chart data (bar, column, line, area, scatter)
            ws.Range("A1").Value = "Period"
            ws.Range("B1").Value = "Series 1"
            ws.Range("C1").Value = "Series 2"
            ws.Range("A2:C5").Value = Array( _
                Array("Q1", 45, 38), _
                Array("Q2", 62, 51), _
                Array("Q3", 38, 44), _
                Array("Q4", 71, 63))
            cht.SetSourceData ws.Range("A1:C5")
        End If

        .Workbook.Close
    End With
End Sub

Private Sub InsertComboChartWithData()
    On Error GoTo ErrorHandler

    Dim sld As Slide
    Dim shp As Shape
    Dim cht As Chart
    Dim chartLeft As Single
    Dim chartTop As Single
    Dim chartWidth As Single
    Dim chartHeight As Single
    Dim ws As Object

    ' Check if we have an active presentation
    If ActivePresentation Is Nothing Then
        MsgBox "Please open a presentation first.", vbExclamation, "Vector"
        Exit Sub
    End If

    ' Get current slide
    Set sld = ActiveWindow.View.Slide

    ' Calculate center position
    chartWidth = 450
    chartHeight = 300
    chartLeft = (ActivePresentation.PageSetup.SlideWidth - chartWidth) / 2
    chartTop = (ActivePresentation.PageSetup.SlideHeight - chartHeight) / 2

    ' Insert combo chart (column + line)
    Set shp = sld.Shapes.AddChart2(-1, xlColumnClustered, chartLeft, chartTop, chartWidth, chartHeight)
    shp.Name = "Vector_ComboChart_" & Format(Now, "hhmmss")
    Set cht = shp.Chart

    ' Populate with data
    With cht.ChartData
        .Activate
        Set ws = .Workbook.Sheets(1)
        ws.Cells.Clear

        ws.Range("A1").Value = "Month"
        ws.Range("B1").Value = "Revenue"
        ws.Range("C1").Value = "Growth %"
        ws.Range("A2:C5").Value = Array( _
            Array("Jan", 120, 5), _
            Array("Feb", 145, 8), _
            Array("Mar", 138, 6), _
            Array("Apr", 162, 12))
        cht.SetSourceData ws.Range("A1:C5")
        .Workbook.Close
    End With

    ' Change second series to line
    cht.SeriesCollection(2).ChartType = xlLine
    cht.SeriesCollection(2).AxisGroup = xlSecondary

    ' Select the new chart
    shp.Select

    Exit Sub

ErrorHandler:
    MsgBox "Error inserting combo chart: " & Err.Description, vbCritical, "Vector"
End Sub

Private Sub RefreshSelectedChart()
    On Error GoTo ErrorHandler

    Dim shp As Shape
    Dim cht As Chart

    ' Check if a shape is selected
    If ActiveWindow.Selection.Type <> ppSelectionShapes Then
        MsgBox "Please select a chart first.", vbExclamation, "Vector"
        Exit Sub
    End If

    Set shp = ActiveWindow.Selection.ShapeRange(1)

    ' Check if it's a chart
    If Not shp.HasChart Then
        MsgBox "Selected shape is not a chart.", vbExclamation, "Vector"
        Exit Sub
    End If

    Set cht = shp.Chart

    ' Refresh by activating and closing chart data
    With cht.ChartData
        .Activate
        .Workbook.Close
    End With

    cht.Refresh

    MsgBox "Chart data refreshed.", vbInformation, "Vector"

    Exit Sub

ErrorHandler:
    MsgBox "Error refreshing chart: " & Err.Description, vbCritical, "Vector"
End Sub
