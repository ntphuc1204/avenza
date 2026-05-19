import queryString from 'query-string';

const normalizeBackendUrl = (inputUrl: string) => {
    if (/^https?:\/\//i.test(inputUrl) || inputUrl.startsWith('/')) {
        return inputUrl;
    }
    return `http://${inputUrl}`;
};

export const sendRequest = async <T>(props: IRequest) => { //type
    let {
        url,
        method,
        body,
        queryParams = {},
        useCredentials = false,
        headers = {},
        nextOption = {}
    } = props;

    url = normalizeBackendUrl(url);

    const options: any = {
        method: method,
        // by default setting the content-type to be json type
        headers: new Headers({ 'content-type': 'application/json', ...headers }),
        body: body ? JSON.stringify(body) : null,
        ...nextOption
    };
    if (useCredentials) options.credentials = "include";

    if (queryParams && Object.keys(queryParams).length) {
        url = `${url}?${queryString.stringify(queryParams)}`;
    }

    try {
        const res = await fetch(url, options);
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
            return json as T;
        }

        return {
            statusCode: res.status,
            message: json?.message ?? json?.error ?? "Unexpected request error",
            error: json?.error ?? json,
        } as T;
    } catch (error) {
        console.error('Request failed', url, error);
        return {
            statusCode: 'FETCH_ERROR',
            message: 'Không thể kết nối đến server',
            error,
        } as any;
    }
};

export const getAccount = async <T>(options?: {
    queryParams?: any;
    headers?: any;
    useCredentials?: boolean;
}) => {
    return sendRequest<T>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/account`,
        method: 'GET',
        headers: options?.headers ?? {},
        queryParams: options?.queryParams ?? {},
        useCredentials: options?.useCredentials ?? false,
    });
};

export const sendRequestFile = async <T>(props: IRequest) => { //type
    let {
        url,
        method,
        body,
        queryParams = {},
        useCredentials = false,
        headers = {},
        nextOption = {}
    } = props;

    const options: any = {
        method: method,
        // by default setting the content-type to be json type
        headers: new Headers({ ...headers }),
        body: body ? body : null,
        ...nextOption
    };
    if (useCredentials) options.credentials = "include";

    if (queryParams) {
        url = `${url}?${queryString.stringify(queryParams)}`;
    }

    return fetch(url, options).then(res => {
        if (res.ok) {
            return res.json() as T; //generic
        } else {
            return res.json().then(function (json) {
                // to be able to access error status when you catch the error 
                return {
                    statusCode: res.status,
                    message: json?.message ?? "",
                    error: json?.error ?? ""
                } as T;
            });
        }
    });
};
