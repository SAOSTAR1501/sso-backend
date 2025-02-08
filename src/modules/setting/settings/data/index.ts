import { systemSettings } from './system.settings';
import { emailSettings } from './email.settings';
import { authSettings } from './auth.settings';
import { notificationSettings } from './notification.settings';
import { languageSettings } from './language.settings';
import { appearanceSettings } from './appearance.settings';
import { securitySettings } from './security.settings';
import { apiSettings } from './api.settings';

export const initialSettings = [
    ...systemSettings,
    ...emailSettings,
    ...authSettings,
    ...notificationSettings,
    ...languageSettings,
    ...appearanceSettings,
    ...securitySettings,
    ...apiSettings
];