import {  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { useTranslation } from 'react-i18next';

const data = [
    { type: "typeA", price: 2600000, storage: 13 },
    { type: "typeB", price: 1350000, storage: 11 },
    { type: "typeC", price: 1150000, storage: 4 },
    { type: "typeD", price: 0, storage: 0 },
    { type: "typeE", price: 0, storage: 0 },
    { type: "typeF", price: 0, storage: 0 },
    { type: "typeG", price: 0, storage: 0 }
  ];
const SimulationTable = () => {
    const {t}=useTranslation()
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>{t('app.type')}</strong></TableCell>
            <TableCell><strong>{t('app.price')}</strong></TableCell>
            <TableCell><strong>{t('app.waterRetention')}</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{t(`app.${row.type}`)}</TableCell>
              <TableCell>{row.price.toLocaleString()} {t('app.yen')}</TableCell>
              <TableCell>{row.storage.toLocaleString()} m³</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default SimulationTable