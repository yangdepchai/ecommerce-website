interface Props {
    params: Promise<{
        category:string;
        subcategory:string;
    }>
}


const Page = async ({params}: Props) => {
    const { category, subcategory } = await params;

    return (
        <div>
            Danh mục: {category} <br/>
            Danh mục con: {subcategory}
        </div>
    )
}
export default Page;