interface Props {
    params: Promise<{
        category:string;
    }>
}


const Page = async ({params}: Props) => {
    const { category } = await params;

    return (
        <div>
            Danh mục: {category}
        </div>
    )
}
export default Page;