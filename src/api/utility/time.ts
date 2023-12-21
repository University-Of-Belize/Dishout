// Credit: https://stackoverflow.com/a/44118363/10976415
function isValidTimeZone(tz: string) {
    if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw new Error('Time zones are not available in this environment');
    }

    try {
        Intl.DateTimeFormat(undefined, {timeZone: tz});
        return true;
    }
    catch (ex) {
        return false;
    }
}

export {isValidTimeZone}