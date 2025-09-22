
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Button,
} from "@mui/material";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

import Logo from "./assets/Picture1.png"; // your logo

export default function ExcelToQuotationForm() {
  const [rows, setRows] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [error, setError] = useState(null);

  const [meta, setMeta] = useState({
    Customer_Name: "",
    Quotation_No: "",
    Date: "",
    Customer_RefNr: "",
    Validation_to: "",
    Person_In_Charge: "",
    Currency: "",
    Transport: "",
    Delivery_Terms: "",
    Payment_Terms: "",
    Discount: "",
    No: "",
    Page: "",
    Total_all: "",
  });

  const headers = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  /* -------- tolerant header/cell helpers -------- */
  const norm = (s) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .replace(/[._\-]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "");

  const getCI = (obj, ...names) => {
    if (!obj) return "";
    const map = Object.keys(obj).reduce((acc, k) => {
      acc[norm(k)] = k;
      return acc;
    }, {});
    for (const name of names) {
      if (name == null) continue;
      const hit = map[norm(name)];
      if (hit) return obj[hit];
    }
    return "";
  };

  const onlyNumber = (val) => {
    if (val === null || val === undefined) return NaN;
    const s = String(val).replace(/[^\d.\-]/g, "");
    return s ? Number(s) : NaN;
  };

  // hydrate meta from first row
  const hydrateMetaFromRow0 = (data) => {
    if (!data || !data.length) return;
    const r0 = data[0];
    setMeta((m) => ({
      ...m,
      Customer_Name: getCI(r0, "Customer_Name", "Customer Name"),
      Quotation_No: getCI(r0, "Quotation_No", "Quotation No"),
      Date: getCI(r0, "Date"),
      Customer_RefNr: getCI(
        r0,
        "Customer_RefNr",
        "Customer Ref.Nr",
        "Customer RefNr"
      ),
      Validation_to: getCI(r0, "Validation_to", "Validation to"),
      Person_In_Charge: getCI(r0, "Person_In_Charge", "Person In Charge"),
      Currency: getCI(r0, "Currency"),
      Transport: getCI(r0, "Transport"),
      Delivery_Terms: getCI(r0, "Delivery_Terms", "Delivery Terms"),
      Payment_Terms: getCI(r0, "Payment_Terms", "Payment Terms"),
      Discount: getCI(r0, "Discount"),
      No: getCI(r0, "No"),
      Page: getCI(r0, "Page"),
      Total_all: getCI(r0, "Total-all", "Total all", "Total_all", "Totalall"),
    }));
  };

  /* -------- items mapping + totals -------- */
  const normalizeItem = (r) => {
    const nameRaw = getCI(r, "Name", "Title", "Code", "Kode/Name");
    const descRaw = getCI(r, "Description", "Desc", "Details");
    const qtyRaw = getCI(r, "Quantity", "Qty");
    const weightRaw = getCI(r, "Weight", "Wt");
    const priceRaw = getCI(r, "Price", "Unit Price", "Unit price", "Cost");
    const totalRaw = getCI(r, "Total", "Amount");

    const qtyNum = onlyNumber(qtyRaw);
    const priceNum = onlyNumber(priceRaw);

    const totalDisplay =
      totalRaw !== "" && totalRaw !== undefined
        ? totalRaw
        : Number.isFinite(qtyNum) && Number.isFinite(priceNum)
        ? qtyNum * priceNum
        : "";

    return {
      Name: nameRaw ?? "",
      Description: descRaw ?? "",
      Quantity: qtyRaw ?? "",
      Weight: weightRaw ?? "",
      Price: priceRaw ?? "",
      Total: totalDisplay,
    };
  };

  const items = useMemo(
    () =>
      rows
        .map(normalizeItem)
        .filter(
          (it) =>
            (it.Name && String(it.Name).trim() !== "") ||
            (it.Description && String(it.Description).trim() !== "")
        ),
    [rows]
  );

  const subTotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const n = onlyNumber(it.Total);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
    [items]
  );

  const discountNum = useMemo(
    () => onlyNumber(meta.Discount) || 0,
    [meta.Discount]
  );

  const grandTotal = useMemo(
    () =>
      Math.max(subTotal - (Number.isFinite(discountNum) ? discountNum : 0), 0),
    [subTotal, discountNum]
  );

  const totalFromSheetDisplay =
    meta.Total_all !== "" && meta.Total_all != null
      ? meta.Total_all
      : grandTotal;

  /* -------- file handling -------- */
  const handleFile = async (e) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const firstSheetName = wb.SheetNames[0];
      setSheetNames(wb.SheetNames);
      setActiveSheet(firstSheetName);
      const ws = wb.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
      setRows(json);
      hydrateMetaFromRow0(json);
    } catch (err) {
      console.error(err);
      setError("Failed to read the file. Make sure it’s a valid Excel/CSV.");
    }
  };

  const switchSheet = (name) => {
    try {
      const input = document.getElementById("excel-input");
      const file = input?.files?.[0];
      if (!file) return;
      file.arrayBuffer().then((data) => {
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[name];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
        setActiveSheet(name);
        setRows(json);
        hydrateMetaFromRow0(json);
      });
    } catch (err) {
      console.error(err);
      setError("Couldn’t switch sheet.");
    }
  };

  const setMetaField = (k, v) => setMeta((m) => ({ ...m, [k]: v }));

  // banner
  const Banner = ({ children }) => (
    <Box
      sx={{
        background: "#d9d9d9",
        py: 0.8,
        px: 1.5,
        display: "inline-block",
        margin: "0 30px",
        width: "80%",
        textAlign: "left",
      }}
    >
      <Typography
        sx={{ fontWeight: 700, letterSpacing: 1, ml: 2, fontSize: 18 }}
      >
        {children}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* File input + sheet picker */}
      <input
        id="excel-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        className="print-hide"
      />

      {sheetNames.length > 1 && (
        <FormControl sx={{ mt: 2, minWidth: 220 }} className="print-hide">
          <InputLabel id="sheet-select-label">Sheet</InputLabel>
          <Select
            labelId="sheet-select-label"
            label="Sheet"
            value={activeSheet || ""}
            onChange={(e) => switchSheet(e.target.value)}
          >
            {sheetNames.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {error && (
        <Typography sx={{ mt: 2 }} color="error">
          {error}
        </Typography>
      )}

      {/* Screen buttons */}
      <Stack direction="row" gap={1} className="print-hide" sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => window.print()}>
          Print Form (A4)
        </Button>
        {/* <Button variant="outlined" onClick={downloadPDF}>
          Download PDF
        </Button> */}
      </Stack>

      {/* The Form */}
      <Card
        className="print-form"
        sx={{ mt: 2, p: { xs: 2, md: 3 }, backgroundColor: "white" }}
        variant="outlined"
      >
        <CardContent sx={{ p: 0 }}>
          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
            {/* LEFT: logo + banner */}
            <Grid size={6}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  height: "100%",
                  gap: 2,
                }}
              >
                <img
                  src={Logo}
                  alt="logo"
                  className="logo-img"
                  style={{ height: 250, margin: "20px 50px" }}
                />
                <Banner>QUOTATION FORM</Banner>
              </Box>
            </Grid>

            {/* RIGHT: meta fields */}
            <Grid item size={6}>
              <Box sx={{ width: { xs: "100%", md: 450 }, marginLeft: "20%" }}>
                {[
                  ["Quotation No", "Quotation_No"],
                  ["Date", "Date"],
                  ["Customer Ref.Nr", "Customer_RefNr"],
                  ["Validation to", "Validation_to"],
                  ["Person In Charge", "Person_In_Charge"],
                  ["Currency", "Currency"],
                  ["Transport", "Transport"],
                  ["Delivery Terms", "Delivery_Terms"],
                  ["Payment Terms", "Payment_Terms"],
                ].map(([label, key]) => (
                  <Stack key={key} direction="row" gap={1} alignItems="center">
                    <Typography
                      sx={{ minWidth: 170, textAlign: "right", fontSize: 14 }}
                    >
                      {label} :
                    </Typography>
                    <TextField
                      variant="standard"
                      fullWidth
                      value={meta[key] || ""}
                      InputProps={{ disableUnderline: true }}
                      onChange={(e) => setMetaField(key, e.target.value)}
                      sx={{ textAlign: "right", fontSize: 14 }}
                    />
                  </Stack>
                ))}
              </Box>
            </Grid>
          </Grid>

          <Typography sx={{ mt: 3, fontWeight: 700, fontSize: 25, ml: "30px" }}>
            Dear Sir:&nbsp;
            <span style={{ fontWeight: 700 }}>{meta.Customer_Name || ""}</span>
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ boxShadow: "none" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    "Name",
                    "Description",
                    "Quantity",
                    "Weight",
                    "Price",
                    "Total",
                  ].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{it.Name}</TableCell>
                    <TableCell>{it.Description}</TableCell>
                    <TableCell>{it.Quantity}</TableCell>
                    <TableCell>{it.Weight}</TableCell>
                    <TableCell>{it.Price}</TableCell>
                    <TableCell>{it.Total}</TableCell>
                  </TableRow>
                ))}
                {/* you can re-enable subTotal row if you want */}
                {/* <TableRow>
                  <TableCell colSpan={4} />
                  <TableCell sx={{ fontWeight: 700 }}>Total:</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{subTotal}</TableCell>
                </TableRow> */}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ pt: 2, maxWidth: 380 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 1, borderBottom: "1px solid #000" }}
                >
                  <Typography sx={{ fontWeight: 700 }}>TOTAL:</Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {totalFromSheetDisplay}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 1, borderBottom: "1px solid #000" }}
                >
                  <Typography sx={{ fontWeight: 700 }}>Discount:</Typography>

                  {/* <TextField
                    variant="standard"
                    value={meta.Discount}
                    InputProps={{ disableUnderline: true }}
                    onChange={(e) => setMetaField("Discount", e.target.value)}
                    inputProps={{
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                    }}
                    sx={{
                      ml: 2,
                      minWidth: 120,
                      textAlign: "right",
                      fontWeight: 600, // 👈 bold
                      paddingRight: "6px", // 👈 move text slightly to the right
                      fontSize: 14,
                    }}
                  /> */}
                  <TextField
                    variant="standard"
                    value={meta.Discount}
                    InputProps={{ disableUnderline: true }}
                    onChange={(e) => setMetaField("Discount", e.target.value)}
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    sx={{
                      ml: 2,
                      minWidth: 120,
                      "& .MuiInputBase-input": {
                        // <-- style the actual input
                        textAlign: "right",
                        fontWeight: 600,
                        paddingRight: "6px",
                        fontSize: 16,
                      },
                    }}
                  />
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 1, borderBottom: "1px solid #000" }}
                >
                  <Typography sx={{ fontWeight: 700 }}>TOTAL:</Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {totalFromSheetDisplay}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
            <Grid item size={6}>
              <Typography
                sx={{ display: "flex", justifyContent: "flex-start" }}
              >
                No: {meta.No}
              </Typography>
            </Grid>
            <Grid item size={6}>
              <Typography>Page: {meta.Page}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          /* Hide only things we mark as screen-only */
          .print-hide { display: none !important; }

          /* Make the logo smaller in print */
          .logo-img { height: 120px !important; margin: 10px 30px !important; }

          /* Keep card clean in print */
          .MuiCard-root { box-shadow: none !important; border: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </Box>
  );
}
