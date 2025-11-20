import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const handleChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Select
    id='lang-switcher'
      value={i18n.language}
      onChange={handleChange}
      displayEmpty
      inputProps={{ 'aria-label': 'language',id: 'lang-switcher-input', }}
      sx={{
        '& .MuiSelect-select': {
          // Use theme text color
          color: theme.palette.text.primary, 
        },
        '& .MuiSelect-icon': {
          // Set the arrow color to black
          color: theme.palette.text.primary,
        },
      }}
    >
      <MenuItem  value="en" sx={{ color: theme.palette.text.primary }}>English</MenuItem>
      <MenuItem  value="ja" sx={{ color: theme.palette.text.primary }}>日本語</MenuItem>
    </Select>
  );
};

export default LanguageSwitcher;
