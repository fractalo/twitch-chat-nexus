export const isWindowAvailable = (_window: Window | null) => {
    if (!_window || _window.closed) {
        return false;
    }

    let isCrossOrigin: boolean;
    try {
        isCrossOrigin = !_window.location.href;
    } catch(e) {
        isCrossOrigin = true;
    }
    return !isCrossOrigin;
};